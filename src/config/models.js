export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  OPENROUTER: 'openrouter'
};

export const MODELS = {
  [AI_PROVIDERS.OPENAI]: {
    'gpt-4': { name: 'GPT-4', provider: AI_PROVIDERS.OPENAI },
    'gpt-4-turbo': { name: 'GPT-4 Turbo', provider: AI_PROVIDERS.OPENAI },
    'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', provider: AI_PROVIDERS.OPENAI }
  },
  [AI_PROVIDERS.ANTHROPIC]: {
    'claude-sonnet-4-20250514': { name: 'Claude Sonnet 4 (Latest)', provider: AI_PROVIDERS.ANTHROPIC, fast: true },
    'claude-3-opus-20240229': { name: 'Claude 3 Opus', provider: AI_PROVIDERS.ANTHROPIC },
    'claude-3-sonnet-20240229': { name: 'Claude 3 Sonnet', provider: AI_PROVIDERS.ANTHROPIC, fast: true },
    'claude-3-haiku-20240307': { name: 'Claude 3 Haiku', provider: AI_PROVIDERS.ANTHROPIC, fast: true }
  },
  [AI_PROVIDERS.OPENROUTER]: {
    'meta-llama/llama-2-70b-chat': { name: 'Llama 2 70B', provider: AI_PROVIDERS.OPENROUTER },
    'anthropic/claude-3-opus': { name: 'Claude 3 Opus (OpenRouter)', provider: AI_PROVIDERS.OPENROUTER },
    'openai/gpt-4': { name: 'GPT-4 (OpenRouter)', provider: AI_PROVIDERS.OPENROUTER }
  }
};

export const getAllModels = () => {
  const allModels = {};
  Object.values(MODELS).forEach(providerModels => {
    Object.assign(allModels, providerModels);
  });
  return allModels;
};