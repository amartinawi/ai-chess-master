import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export class GameLogger {
  constructor(gameId) {
    this.gameId = gameId;
    this.logs = [];
    this.logFile = path.join(process.cwd(), 'logs', `game_${gameId}.json`);
  }

  async ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    try {
      await fs.mkdir(logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  logAIRequest(playerInfo, request, response, duration, gameState, error = null) {
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      gameId: this.gameId,
      type: 'ai_request',
      player: {
        color: playerInfo.color,
        modelId: playerInfo.modelId,
        provider: playerInfo.provider,
        name: playerInfo.name
      },
      request: {
        prompt: request.prompt,
        fen: gameState.fen,
        moveNumber: Math.floor(gameState.history.length / 2) + 1,
        turn: gameState.currentTurn
      },
      response: {
        content: response,
        parsedMove: null,
        success: error === null
      },
      performance: {
        duration,
        thinkingTime: duration
      },
      gameContext: {
        fen: gameState.fen,
        pgn: gameState.pgn,
        isCheck: gameState.isCheck,
        isGameOver: gameState.isGameOver,
        status: gameState.status
      },
      error: error ? {
        message: error.message,
        type: error.constructor.name
      } : null
    };

    this.logs.push(logEntry);
    this.saveLogAsync(logEntry);
    console.log(`[GameLogger] AI Request logged for ${playerInfo.color} (${playerInfo.name}) - Total logs: ${this.logs.length}`);
    return logEntry;
  }

  logGameEvent(eventType, data) {
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      gameId: this.gameId,
      type: 'game_event',
      eventType,
      data
    };

    this.logs.push(logEntry);
    this.saveLogAsync(logEntry);
    return logEntry;
  }

  logMove(moveData, gameState) {
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      gameId: this.gameId,
      type: 'move',
      move: {
        san: moveData.move.san,
        from: moveData.move.from,
        to: moveData.move.to,
        piece: moveData.move.piece,
        captured: moveData.move.captured || null,
        promotion: moveData.move.promotion || null,
        flags: moveData.move.flags
      },
      player: moveData.player,
      gameState: {
        fen: gameState.fen,
        pgn: gameState.pgn,
        moveNumber: Math.floor(gameState.history.length / 2) + 1,
        isCheck: gameState.isCheck,
        isGameOver: gameState.isGameOver,
        status: gameState.status
      }
    };

    this.logs.push(logEntry);
    this.saveLogAsync(logEntry);
    return logEntry;
  }

  async saveLogAsync(logEntry) {
    try {
      await this.ensureLogDirectory();
      const allLogs = await this.loadExistingLogs();
      allLogs.push(logEntry);
      await fs.writeFile(this.logFile, JSON.stringify(allLogs, null, 2));
    } catch (error) {
      console.error('Failed to save log entry:', error);
    }
  }

  async loadExistingLogs() {
    try {
      const data = await fs.readFile(this.logFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  getBacklog() {
    // Return AI request logs and move logs for the backlog display
    return this.logs.filter(log => 
      log.type === 'ai_request' || log.type === 'move' || (log.request && log.response)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  getAIRequestLogs() {
    return this.logs.filter(log => log.request && log.response);
  }

  getMoveLogs() {
    return this.logs.filter(log => log.type === 'move');
  }

  getLogsForPlayer(color) {
    return this.logs.filter(log => 
      log.player && log.player.color === color
    );
  }

  getPerformanceStats() {
    const aiLogs = this.getAIRequestLogs();
    const whitePlayerLogs = aiLogs.filter(log => log.player.color === 'white');
    const blackPlayerLogs = aiLogs.filter(log => log.player.color === 'black');

    const calculateStats = (logs) => {
      if (logs.length === 0) return null;
      
      const durations = logs.map(log => log.performance.duration);
      const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
      const avgTime = totalTime / durations.length;
      const minTime = Math.min(...durations);
      const maxTime = Math.max(...durations);
      
      return {
        totalRequests: logs.length,
        totalTime,
        averageTime: avgTime,
        minTime,
        maxTime,
        successRate: logs.filter(log => log.response.success).length / logs.length
      };
    };

    return {
      white: calculateStats(whitePlayerLogs),
      black: calculateStats(blackPlayerLogs),
      overall: calculateStats(aiLogs)
    };
  }

  async exportLogs(format = 'json') {
    await this.ensureLogDirectory();
    const exportData = {
      gameId: this.gameId,
      exportTimestamp: new Date().toISOString(),
      logs: this.logs,
      stats: this.getPerformanceStats()
    };

    if (format === 'json') {
      const filename = `export_${this.gameId}_${Date.now()}.json`;
      const filepath = path.join(path.dirname(this.logFile), filename);
      await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
      return filepath;
    }

    throw new Error(`Unsupported export format: ${format}`);
  }

  clear() {
    this.logs = [];
  }
}