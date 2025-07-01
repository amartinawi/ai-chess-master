import axios from 'axios';
import { AIPlayer } from '../AIPlayer.js';

export class OpenRouterPlayer extends AIPlayer {
  constructor(color, modelId, apiKey, name = null, options = {}) {
    super(color, modelId, apiKey, 'openrouter', name, options);
    this.baseURL = 'https://openrouter.ai/api/v1';
  }

  async callAI(prompt) {
    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.modelId,
        messages: [
          {
            role: 'system',
            content: 'You are a chess grandmaster. Analyze positions deeply and make the best possible moves. Always respond with your analysis followed by "MOVE: [your move]".'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Chess Match'
        }
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from OpenRouter API');
    }

    return response.data.choices[0].message.content;
  }
}