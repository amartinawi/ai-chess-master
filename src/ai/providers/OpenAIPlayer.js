import axios from 'axios';
import { AIPlayer } from '../AIPlayer.js';

export class OpenAIPlayer extends AIPlayer {
  constructor(color, modelId, apiKey, name = null, options = {}) {
    super(color, modelId, apiKey, 'openai', name, options);
    this.baseURL = 'https://api.openai.com/v1';
  }

  async callAI(prompt) {
    const systemMessage = this.fastMode 
      ? 'Chess expert. Reply with move in format "MOVE: [move]". Be concise.'
      : 'You are a chess expert. Analyze positions and make strong moves. Format: "MOVE: [your move]".';

    const response = await axios.post(
      `${this.baseURL}/chat/completions`,
      {
        model: this.modelId,
        messages: [
          {
            role: 'system',
            content: systemMessage
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
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response from OpenAI API');
    }

    return response.data.choices[0].message.content;
  }
}