import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';

export class ChessGame {
  constructor(whitePlayer, blackPlayer) {
    this.id = uuidv4();
    this.chess = new Chess();
    this.whitePlayer = whitePlayer;
    this.blackPlayer = blackPlayer;
    this.moveHistory = [];
    this.gameLog = [];
    this.status = 'active';
    this.currentTurn = 'white';
    this.startTime = new Date();
    this.pausedTime = null;
    this.totalPausedDuration = 0;
    this.isPaused = false;
    this.isStopped = false;
  }

  getCurrentPlayer() {
    return this.currentTurn === 'white' ? this.whitePlayer : this.blackPlayer;
  }

  getOpponentPlayer() {
    return this.currentTurn === 'white' ? this.blackPlayer : this.whitePlayer;
  }

  getFEN() {
    return this.chess.fen();
  }

  getPGN() {
    return this.chess.pgn();
  }

  getHistory() {
    return this.chess.history({ verbose: true });
  }

  getMoveHistory() {
    return this.moveHistory;
  }

  getGameState() {
    return {
      id: this.id,
      fen: this.getFEN(),
      pgn: this.getPGN(),
      history: this.getHistory(),
      currentTurn: this.currentTurn,
      status: this.status,
      whitePlayer: this.whitePlayer.getInfo(),
      blackPlayer: this.blackPlayer.getInfo(),
      moveHistory: this.moveHistory,
      gameLog: this.gameLog,
      startTime: this.startTime,
      isGameOver: this.chess.isGameOver(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
      isDraw: this.chess.isDraw(),
      validMoves: this.getValidMoves().map(move => move.san),
      isPaused: this.isPaused,
      isStopped: this.isStopped,
      pausedTime: this.pausedTime,
      totalPausedDuration: this.totalPausedDuration,
      actualGameDuration: this.getActualGameDuration()
    };
  }

  makeMove(move) {
    try {
      const moveObj = this.chess.move(move);
      if (moveObj) {
        this.moveHistory.push({
          move: moveObj,
          fen: this.getFEN(),
          timestamp: new Date(),
          player: this.currentTurn
        });
        
        this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
        
        if (this.chess.isGameOver()) {
          this.status = 'finished';
          if (this.chess.isCheckmate()) {
            this.status = `checkmate_${moveObj.color === 'w' ? 'white' : 'black'}_wins`;
          } else if (this.chess.isStalemate()) {
            this.status = 'stalemate';
          } else if (this.chess.isDraw()) {
            this.status = 'draw';
          }
        }
        
        return { success: true, move: moveObj, gameState: this.getGameState() };
      }
      return { success: false, error: 'Invalid move' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  logAIRequest(player, request, response, duration) {
    this.gameLog.push({
      id: uuidv4(),
      timestamp: new Date(),
      player: player.color,
      playerInfo: player.getInfo(),
      request,
      response,
      duration,
      fen: this.getFEN(),
      moveNumber: Math.floor(this.moveHistory.length / 2) + 1
    });
  }

  getValidMoves() {
    return this.chess.moves({ verbose: true });
  }

  reset() {
    this.chess.reset();
    this.moveHistory = [];
    this.gameLog = [];
    this.status = 'active';
    this.currentTurn = 'white';
    this.startTime = new Date();
  }

  loadPosition(fen) {
    try {
      this.chess.load(fen);
      this.currentTurn = this.chess.turn() === 'w' ? 'white' : 'black';
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  pauseGame() {
    if (this.isPaused || this.isStopped || this.chess.isGameOver()) {
      return { success: false, error: 'Cannot pause game in current state' };
    }

    this.isPaused = true;
    this.pausedTime = new Date();
    this.status = 'paused';

    return { 
      success: true, 
      message: 'Game paused',
      pausedAt: this.pausedTime
    };
  }

  resumeGame() {
    if (!this.isPaused || this.isStopped) {
      return { success: false, error: 'Cannot resume game in current state' };
    }

    if (this.pausedTime) {
      this.totalPausedDuration += Date.now() - this.pausedTime.getTime();
    }

    this.isPaused = false;
    this.pausedTime = null;
    this.status = 'active';

    return { 
      success: true, 
      message: 'Game resumed',
      totalPausedDuration: this.totalPausedDuration
    };
  }

  stopGame() {
    if (this.isStopped) {
      return { success: false, error: 'Game is already stopped' };
    }

    // If game was paused when stopped, calculate final paused duration
    if (this.isPaused && this.pausedTime) {
      this.totalPausedDuration += Date.now() - this.pausedTime.getTime();
    }

    this.isStopped = true;
    this.isPaused = false;
    this.pausedTime = null;
    this.status = 'stopped';

    return { 
      success: true, 
      message: 'Game stopped',
      finalDuration: this.getActualGameDuration(),
      totalMoves: this.moveHistory.length
    };
  }

  getActualGameDuration() {
    const now = Date.now();
    const startTime = this.startTime.getTime();
    let totalDuration = now - startTime;

    // Subtract paused time
    let pausedDuration = this.totalPausedDuration;
    
    // If currently paused, add current pause duration
    if (this.isPaused && this.pausedTime) {
      pausedDuration += now - this.pausedTime.getTime();
    }

    return Math.max(0, totalDuration - pausedDuration);
  }

  canMakeMove() {
    return !this.isPaused && !this.isStopped && !this.chess.isGameOver();
  }
}