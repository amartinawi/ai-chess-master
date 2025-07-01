import { MODELS, getAllModels } from './models.js';
import { AIPlayerFactory } from '../ai/AIPlayerFactory.js';

export class GameConfig {
  constructor() {
    this.configs = new Map();
  }

  createGameConfig(configData) {
    const {
      gameId,
      whitePlayer,
      blackPlayer,
      timeControl = null,
      startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      optimizationSettings = {}
    } = configData;

    if (!whitePlayer || !blackPlayer) {
      throw new Error('Both white and black player configurations are required');
    }

    this.validatePlayerConfig(whitePlayer, 'white');
    this.validatePlayerConfig(blackPlayer, 'black');

    // Set default optimization settings
    const defaultOptimization = {
      fastMode: true,
      includeAnalysis: false,
      useCache: true,
      maxTokens: null, // Will be set based on fastMode
      temperature: null // Will be set based on fastMode
    };
    
    const finalOptimization = { ...defaultOptimization, ...optimizationSettings };

    const config = {
      gameId: gameId || this.generateGameId(),
      whitePlayer: { ...whitePlayer, optimizationSettings: finalOptimization },
      blackPlayer: { ...blackPlayer, optimizationSettings: finalOptimization },
      timeControl,
      startingPosition,
      optimizationSettings: finalOptimization,
      createdAt: new Date()
    };

    this.configs.set(config.gameId, config);
    return config;
  }

  validatePlayerConfig(playerConfig, color) {
    const { modelId, apiKey, name } = playerConfig;

    if (!modelId) {
      throw new Error(`Model ID is required for ${color} player`);
    }

    if (!apiKey) {
      throw new Error(`API key is required for ${color} player`);
    }

    const allModels = getAllModels();
    if (!allModels[modelId]) {
      throw new Error(`Model ${modelId} is not supported`);
    }

    return true;
  }

  createPlayersFromConfig(config) {
    const allModels = getAllModels();
    
    const whiteProvider = allModels[config.whitePlayer.modelId].provider;
    const blackProvider = allModels[config.blackPlayer.modelId].provider;

    const whitePlayer = AIPlayerFactory.createPlayer(
      'white',
      config.whitePlayer.modelId,
      config.whitePlayer.apiKey,
      whiteProvider,
      config.whitePlayer.name,
      config.whitePlayer.optimizationSettings
    );

    const blackPlayer = AIPlayerFactory.createPlayer(
      'black',
      config.blackPlayer.modelId,
      config.blackPlayer.apiKey,
      blackProvider,
      config.blackPlayer.name,
      config.blackPlayer.optimizationSettings
    );

    return { whitePlayer, blackPlayer };
  }

  getConfig(gameId) {
    return this.configs.get(gameId);
  }

  getAllConfigs() {
    return Array.from(this.configs.values());
  }

  deleteConfig(gameId) {
    return this.configs.delete(gameId);
  }

  generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  getAvailableModels() {
    return getAllModels();
  }

  exportConfig(gameId) {
    const config = this.getConfig(gameId);
    if (!config) {
      throw new Error(`Game config ${gameId} not found`);
    }

    // Remove sensitive API keys from export
    const exportData = {
      ...config,
      whitePlayer: {
        ...config.whitePlayer,
        apiKey: '***HIDDEN***'
      },
      blackPlayer: {
        ...config.blackPlayer,
        apiKey: '***HIDDEN***'
      }
    };

    return exportData;
  }
}