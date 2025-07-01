import { OpenAIPlayer } from './providers/OpenAIPlayer.js';
import { AnthropicPlayer } from './providers/AnthropicPlayer.js';
import { OpenRouterPlayer } from './providers/OpenRouterPlayer.js';
import { AI_PROVIDERS } from '../config/models.js';

export class AIPlayerFactory {
  static createPlayer(color, modelId, apiKey, provider, name = null, options = {}) {
    switch (provider) {
      case AI_PROVIDERS.OPENAI:
        return new OpenAIPlayer(color, modelId, apiKey, name, options);
      
      case AI_PROVIDERS.ANTHROPIC:
        return new AnthropicPlayer(color, modelId, apiKey, name, options);
      
      case AI_PROVIDERS.OPENROUTER:
        return new OpenRouterPlayer(color, modelId, apiKey, name, options);
      
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  static getProviderFromModel(modelId, models) {
    for (const [provider, providerModels] of Object.entries(models)) {
      if (modelId in providerModels) {
        return provider;
      }
    }
    throw new Error(`Model ${modelId} not found in available models`);
  }
}