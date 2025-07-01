import axios from 'axios';
import { AIPlayer } from '../AIPlayer.js';

export class AnthropicPlayer extends AIPlayer {
  constructor(color, modelId, apiKey, name = null, options = {}) {
    super(color, modelId, apiKey, 'anthropic', name, options);
    this.baseURL = 'https://api.anthropic.com/v1';
  }

  async callAI(prompt) {
    const systemPrompt = this.fastMode
      ? 'Chess expert. Reply with move in format "MOVE: [move]". Be concise.'
      : 'You are a chess expert. Analyze positions and make strong moves. Format: "MOVE: [your move]".';

    const response = await axios.post(
      `${this.baseURL}/messages`,
      {
        model: this.modelId,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${prompt}`
          }
        ]
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        }
      }
    );

    if (!response.data.content || response.data.content.length === 0) {
      throw new Error('No response from Anthropic API');
    }

    return response.data.content[0].text;
  }
}