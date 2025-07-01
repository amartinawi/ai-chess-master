import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { ChessGame } from '../game/ChessGame.js';
import { GameConfig } from '../config/GameConfig.js';
import { GameLogger } from '../logging/GameLogger.js';
import { getAllModels } from '../config/models.js';

export class GameServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.games = new Map();
    this.gameConfig = new GameConfig();
    this.clients = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(process.cwd(), 'public')));
  }

  setupRoutes() {
    // Get available models
    this.app.get('/api/models', (req, res) => {
      res.json(getAllModels());
    });

    // Get cache statistics
    this.app.get('/api/cache/stats', (req, res) => {
      // Import AIPlayer to access the cache
      import('../ai/AIPlayer.js').then(({ AIPlayer }) => {
        if (AIPlayer.cache) {
          res.json(AIPlayer.cache.getStats());
        } else {
          res.json({ message: 'Cache not initialized' });
        }
      }).catch(() => {
        res.json({ message: 'Cache not available' });
      });
    });

    // Create new game
    this.app.post('/api/games', async (req, res) => {
      try {
        const config = this.gameConfig.createGameConfig(req.body);
        const { whitePlayer, blackPlayer } = this.gameConfig.createPlayersFromConfig(config);
        
        const game = new ChessGame(whitePlayer, blackPlayer);
        const logger = new GameLogger(game.id);
        
        this.games.set(game.id, { game, config, logger });
        
        logger.logGameEvent('game_created', {
          gameId: game.id,
          whitePlayer: whitePlayer.getInfo(),
          blackPlayer: blackPlayer.getInfo()
        });

        res.json({
          gameId: game.id,
          gameState: game.getGameState(),
          config: this.gameConfig.exportConfig(config.gameId)
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });

    // Get game state
    this.app.get('/api/games/:gameId', (req, res) => {
      const gameData = this.games.get(req.params.gameId);
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json({
        gameState: gameData.game.getGameState(),
        config: this.gameConfig.exportConfig(gameData.config.gameId)
      });
    });

    // Get game backlog/logs
    this.app.get('/api/games/:gameId/backlog', (req, res) => {
      const gameData = this.games.get(req.params.gameId);
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const backlog = gameData.logger.getBacklog();
      const aiRequestLogs = gameData.logger.getAIRequestLogs();
      const moveLogs = gameData.logger.getMoveLogs();
      
      res.json({
        backlog: backlog,
        aiRequestLogs: aiRequestLogs,
        moveLogs: moveLogs,
        stats: gameData.logger.getPerformanceStats(),
        totalEntries: {
          all: backlog.length,
          aiRequests: aiRequestLogs.length,
          moves: moveLogs.length
        }
      });
    });

    // Start/Resume game
    this.app.post('/api/games/:gameId/start', async (req, res) => {
      const gameData = this.games.get(req.params.gameId);
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      try {
        // If game is paused, resume it
        if (gameData.game.isPaused) {
          const resumeResult = gameData.game.resumeGame();
          if (resumeResult.success) {
            gameData.logger.logGameEvent('game_resumed', {
              resumedAt: new Date(),
              totalPausedDuration: resumeResult.totalPausedDuration
            });
            this.broadcastGameUpdate(req.params.gameId, gameData.game.getGameState());
          }
        }

        await this.playNextMove(req.params.gameId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Pause game
    this.app.post('/api/games/:gameId/pause', (req, res) => {
      const gameData = this.games.get(req.params.gameId);
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const pauseResult = gameData.game.pauseGame();
      if (pauseResult.success) {
        gameData.logger.logGameEvent('game_paused', {
          pausedAt: pauseResult.pausedAt,
          currentMove: gameData.game.moveHistory.length
        });
        this.broadcastGameUpdate(req.params.gameId, gameData.game.getGameState());
      }

      res.json(pauseResult);
    });

    // Resume game
    this.app.post('/api/games/:gameId/resume', async (req, res) => {
      const gameData = this.games.get(req.params.gameId);
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const resumeResult = gameData.game.resumeGame();
      if (resumeResult.success) {
        gameData.logger.logGameEvent('game_resumed', {
          resumedAt: new Date(),
          totalPausedDuration: resumeResult.totalPausedDuration
        });
        this.broadcastGameUpdate(req.params.gameId, gameData.game.getGameState());
        
        // Continue the game after resume
        setTimeout(() => this.playNextMove(req.params.gameId), 1000);
      }

      res.json(resumeResult);
    });

    // Stop game
    this.app.post('/api/games/:gameId/stop', (req, res) => {
      const gameData = this.games.get(req.params.gameId);
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const stopResult = gameData.game.stopGame();
      if (stopResult.success) {
        gameData.logger.logGameEvent('game_stopped', {
          stoppedAt: new Date(),
          finalDuration: stopResult.finalDuration,
          totalMoves: stopResult.totalMoves,
          finalPosition: gameData.game.getFEN()
        });
        this.broadcastGameUpdate(req.params.gameId, gameData.game.getGameState());
      }

      res.json(stopResult);
    });

    // Make manual move (for testing)
    this.app.post('/api/games/:gameId/move', (req, res) => {
      const gameData = this.games.get(req.params.gameId);
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      const { move } = req.body;
      const result = gameData.game.makeMove(move);
      
      if (result.success) {
        gameData.logger.logMove(result, result.gameState);
        this.broadcastGameUpdate(req.params.gameId, result.gameState);
      }

      res.json(result);
    });

    // Reset game
    this.app.post('/api/games/:gameId/reset', (req, res) => {
      const gameData = this.games.get(req.params.gameId);
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      gameData.game.reset();
      gameData.logger.clear();
      gameData.logger.logGameEvent('game_reset', { gameId: req.params.gameId });

      const gameState = gameData.game.getGameState();
      this.broadcastGameUpdate(req.params.gameId, gameState);
      
      res.json({ success: true, gameState });
    });

    // Export game logs
    this.app.get('/api/games/:gameId/export', async (req, res) => {
      const gameData = this.games.get(req.params.gameId);
      if (!gameData) {
        return res.status(404).json({ error: 'Game not found' });
      }

      try {
        const filepath = await gameData.logger.exportLogs();
        res.download(filepath);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, { ws, gameId: null });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(clientId, message);
        } catch (error) {
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
      });

      ws.send(JSON.stringify({ 
        type: 'connection', 
        clientId,
        message: 'Connected to chess game server' 
      }));
    });
  }

  handleWebSocketMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        client.gameId = message.gameId;
        this.clients.set(clientId, client);
        
        const gameData = this.games.get(message.gameId);
        if (gameData) {
          client.ws.send(JSON.stringify({
            type: 'game_state',
            gameState: gameData.game.getGameState()
          }));
        }
        break;

      case 'unsubscribe':
        client.gameId = null;
        this.clients.set(clientId, client);
        break;
    }
  }

  async playNextMove(gameId) {
    const gameData = this.games.get(gameId);
    if (!gameData) {
      throw new Error('Game not found');
    }

    const { game, logger } = gameData;
    
    // Check if game can make a move (not paused, stopped, or finished)
    if (!game.canMakeMove()) {
      if (game.isPaused) {
        logger.logGameEvent('move_skipped_paused', {
          currentTurn: game.currentTurn,
          pausedAt: game.pausedTime
        });
      } else if (game.isStopped) {
        logger.logGameEvent('move_skipped_stopped', {
          currentTurn: game.currentTurn,
          stoppedAt: new Date()
        });
      }
      return;
    }
    
    if (game.chess.isGameOver()) {
      logger.logGameEvent('game_finished', {
        result: game.status,
        finalPosition: game.getFEN()
      });
      return;
    }

    const currentPlayer = game.getCurrentPlayer();
    const gameState = game.getGameState();
    
    logger.logGameEvent('ai_thinking', {
      player: currentPlayer.color,
      modelId: currentPlayer.modelId
    });

    this.broadcastGameUpdate(gameId, gameState, 'ai_thinking');

    try {
      const moveResult = await currentPlayer.makeMove(gameState);
      
      logger.logAIRequest(
        currentPlayer.getInfo(),
        { prompt: moveResult.prompt },
        moveResult.response,
        moveResult.thinkingTime,
        gameState,
        moveResult.success ? null : new Error(moveResult.error)
      );

      if (moveResult.success) {
        const gameResult = game.makeMove(moveResult.move);
        
        if (gameResult.success) {
          // Clear any previous invalid move record
          currentPlayer.clearInvalidMove();
          
          logger.logMove({ 
            move: gameResult.move, 
            player: currentPlayer.color 
          }, gameResult.gameState);

          this.broadcastGameUpdate(gameId, gameResult.gameState);

          // Continue game if not finished and not paused/stopped
          if (!game.chess.isGameOver() && game.canMakeMove()) {
            setTimeout(() => this.playNextMove(gameId), 2000);
          } else {
            logger.logGameEvent('game_finished', {
              result: gameResult.gameState.status,
              finalPosition: gameResult.gameState.fen
            });
          }
        } else {
          // Record the invalid move for feedback
          currentPlayer.recordInvalidMove(moveResult.move);
          
          logger.logGameEvent('invalid_move', {
            player: currentPlayer.color,
            attemptedMove: moveResult.move,
            error: gameResult.error,
            availableMoves: gameState.validMoves,
            invalidMoveCount: currentPlayer.invalidMoveCount
          });
          
          console.log(`Invalid move ${moveResult.move} by ${currentPlayer.color}: ${gameResult.error}`);
          console.log(`Available moves were: ${gameState.validMoves.join(', ')}`);
          console.log(`This is invalid move #${currentPlayer.invalidMoveCount} for this player`);
          
          // Prevent infinite loops - if too many invalid moves, pick a random valid move
          if (currentPlayer.invalidMoveCount >= 3 && gameState.validMoves.length > 0) {
            const randomMove = gameState.validMoves[Math.floor(Math.random() * gameState.validMoves.length)];
            console.log(`Too many invalid moves, forcing random valid move: ${randomMove}`);
            
            const forceResult = game.makeMove(randomMove);
            if (forceResult.success) {
              currentPlayer.clearInvalidMove();
              logger.logMove({ 
                move: forceResult.move, 
                player: currentPlayer.color,
                forced: true
              }, forceResult.gameState);
              
              this.broadcastGameUpdate(gameId, forceResult.gameState);
              
              if (!game.chess.isGameOver()) {
                setTimeout(() => this.playNextMove(gameId), 2000);
              }
              return;
            }
          }
          
          // Retry after invalid move with a shorter delay (only if game can still make moves)
          if (game.canMakeMove()) {
            setTimeout(() => this.playNextMove(gameId), 500);
          }
        }
      } else {
        logger.logGameEvent('ai_error', {
          player: currentPlayer.color,
          error: moveResult.error
        });
        
        // Retry after AI error (only if game can still make moves)
        if (game.canMakeMove()) {
          setTimeout(() => this.playNextMove(gameId), 5000);
        }
      }
    } catch (error) {
      logger.logGameEvent('system_error', {
        player: currentPlayer.color,
        error: error.message
      });
      
      console.error('Error in playNextMove:', error);
    }
  }

  broadcastGameUpdate(gameId, gameState, event = 'game_update') {
    const message = JSON.stringify({
      type: event,
      gameId,
      gameState,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client) => {
      if (client.gameId === gameId && client.ws.readyState === 1) {
        client.ws.send(message);
      }
    });
  }

  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(`Chess game server running on http://localhost:${this.port}`);
    });
  }
}