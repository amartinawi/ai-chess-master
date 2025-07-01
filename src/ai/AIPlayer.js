import { v4 as uuidv4 } from 'uuid';
import { MoveCache } from '../cache/MoveCache.js';

export class AIPlayer {
  constructor(color, modelId, apiKey, provider, name = null, options = {}) {
    this.id = uuidv4();
    this.color = color;
    this.modelId = modelId;
    this.apiKey = apiKey;
    this.provider = provider;
    this.name = name || `${modelId} (${color})`;
    this.moveCount = 0;
    this.totalThinkingTime = 0;
    this.lastInvalidMove = null;
    this.invalidMoveCount = 0;
    
    // Optimization options
    this.fastMode = options.fastMode !== false; // Default to fast mode
    this.includeAnalysis = options.includeAnalysis === true; // Default to no analysis
    this.maxTokens = options.maxTokens || (this.fastMode ? 150 : 800);
    this.temperature = options.temperature || (this.fastMode ? 0.1 : 0.3);
    this.useCache = options.useCache !== false; // Default to use cache
    
    // Initialize cache (shared across instances by model)
    if (!AIPlayer.cache) {
      AIPlayer.cache = new MoveCache();
    }
  }

  getInfo() {
    return {
      id: this.id,
      color: this.color,
      modelId: this.modelId,
      provider: this.provider,
      name: this.name,
      moveCount: this.moveCount,
      totalThinkingTime: this.totalThinkingTime
    };
  }

  async makeMove(gameState) {
    const startTime = Date.now();
    
    try {
      // Check cache first
      if (this.useCache) {
        const cached = AIPlayer.cache.get(gameState.fen, this.modelId, gameState.validMoves);
        if (cached) {
          const endTime = Date.now();
          const thinkingTime = endTime - startTime;
          this.totalThinkingTime += thinkingTime;
          this.moveCount++;
          
          console.log(`Cache hit for ${this.color} - move: ${cached.move}`);
          return {
            success: true,
            move: cached.move,
            response: cached.response,
            thinkingTime,
            prompt: '[Cached response]',
            cached: true
          };
        }
      }
      
      const prompt = this.generateChessPrompt(gameState);
      const response = await this.callAI(prompt);
      
      let move;
      try {
        move = this.parseMove(response);
      } catch (parseError) {
        // Try to find a close match in valid moves
        const closestMove = this.findClosestValidMove(response, gameState.validMoves);
        if (closestMove) {
          move = closestMove;
          console.log(`Move parsing failed, using closest valid move: ${move}`);
        } else {
          throw parseError;
        }
      }
      
      // Validate the move against the available legal moves
      if (gameState.validMoves && !this.validateMoveAgainstList(move, gameState.validMoves)) {
        // Try to find a close match as last resort
        const closestMove = this.findClosestValidMove(response, gameState.validMoves);
        if (closestMove) {
          move = closestMove;
          console.log(`Move validation failed, using closest valid move: ${move}`);
        } else {
          throw new Error(`Parsed move "${move}" is not in the list of valid moves: ${gameState.validMoves.join(', ')}`);
        }
      }
      
      // Cache the successful result
      if (this.useCache && move) {
        AIPlayer.cache.set(gameState.fen, this.modelId, gameState.validMoves, response, move);
      }
      
      const endTime = Date.now();
      const thinkingTime = endTime - startTime;
      this.totalThinkingTime += thinkingTime;
      this.moveCount++;
      
      return {
        success: true,
        move,
        response,
        thinkingTime,
        prompt,
        cached: false
      };
    } catch (error) {
      const endTime = Date.now();
      const thinkingTime = endTime - startTime;
      
      return {
        success: false,
        error: error.message,
        thinkingTime,
        prompt: this.generateChessPrompt(gameState)
      };
    }
  }

  generateChessPrompt(gameState) {
    const { fen, history, currentTurn, isCheck, validMoves } = gameState;
    
    if (this.fastMode) {
      return this.generateFastPrompt(gameState);
    } else {
      return this.generateDetailedPrompt(gameState);
    }
  }

  generateFastPrompt(gameState) {
    const { fen, currentTurn, isCheck, validMoves } = gameState;
    
    let prompt = `Chess ${this.color}. Turn: ${currentTurn}. FEN: ${fen}\n`;
    
    if (isCheck) {
      prompt += `⚠️ CHECK! Must escape.\n`;
    }
    
    if (this.lastInvalidMove) {
      prompt += `❌ Last "${this.lastInvalidMove}" invalid. Pick different.\n`;
    }
    
    prompt += `Legal moves: ${validMoves.join(', ')}\n\n`;
    
    if (this.includeAnalysis) {
      prompt += `Brief analysis then move:\nANALYSIS: [Quick tactical check]\n`;
    }
    
    prompt += `MOVE: [Pick ONE from legal moves]`;
    
    return prompt;
  }

  generateDetailedPrompt(gameState) {
    const { fen, history, currentTurn, isCheck, validMoves } = gameState;
    
    let prompt = `You are playing chess as ${this.color}. Turn: ${currentTurn}\n`;
    prompt += `Position: ${fen}\n`;
    
    if (isCheck) {
      prompt += `⚠️ King in CHECK! Must escape check.\n`;
    }
    
    prompt += `Legal moves: ${validMoves.join(', ')}\n\n`;
    
    if (this.lastInvalidMove) {
      prompt += `Previous move "${this.lastInvalidMove}" was invalid. Choose different move.\n\n`;
    }
    
    // Show recent moves (condensed)
    if (history && history.length > 0) {
      const recent = history.slice(-6);
      let moves = '';
      for (let i = 0; i < recent.length; i += 2) {
        const moveNum = Math.floor((history.length - recent.length + i) / 2) + 1;
        const white = recent[i] ? recent[i].san : '';
        const black = recent[i + 1] ? recent[i + 1].san : '';
        moves += `${moveNum}.${white}${black ? ` ${black}` : ''} `;
      }
      prompt += `Recent: ${moves}\n\n`;
    }
    
    if (this.includeAnalysis) {
      prompt += `Consider: threats, tactics, king safety, material.\n`;
      prompt += `ANALYSIS: [Your analysis]\n`;
    }
    
    prompt += `MOVE: [ONE move from legal list in SAN]`;
    
    return prompt;
  }

  // Helper method to extract valid moves from context (will be overridden by game engine)
  getValidMovesFromFEN(fen) {
    // This is a placeholder - the actual valid moves will be provided by the game engine
    return [];
  }

  async callAI(prompt) {
    // This will be implemented by specific provider classes
    throw new Error('callAI method must be implemented by subclass');
  }

  parseMove(response) {
    // Clean up the response
    const cleanResponse = response.replace(/['"]/g, '').trim();
    
    // Try to find MOVE: line first
    const lines = cleanResponse.split('\n');
    for (const line of lines) {
      if (line.match(/^MOVE\s*:/i)) {
        const move = line.replace(/^MOVE\s*:/i, '').trim();
        if (this.isValidMoveFormat(move)) {
          return move;
        }
      }
    }
    
    // Enhanced regex for chess moves in SAN notation
    const movePatterns = [
      // Standard piece moves: Nf3, Bb5, Qd4, etc.
      /\b([NBRQK][a-h]?[1-8]?x?[a-h][1-8](?:=[NBRQ])?[+#]?)\b/g,
      // Pawn moves: e4, exd5, e8=Q+, etc.
      /\b([a-h](?:[a-h]?x)?[a-h]?[1-8](?:=[NBRQ])?[+#]?)\b/g,
      // Castling: O-O, O-O-O
      /\b(O-O(?:-O)?[+#]?)\b/g,
      // UCI notation as fallback: e2e4, g1f3, etc.
      /\b([a-h][1-8][a-h][1-8][nbrq]?)\b/g
    ];
    
    let foundMoves = [];
    
    for (const pattern of movePatterns) {
      const matches = [...cleanResponse.matchAll(pattern)];
      for (const match of matches) {
        const move = match[1];
        if (this.isValidMoveFormat(move)) {
          foundMoves.push(move);
        }
      }
    }
    
    // Remove duplicates and prefer the last valid move found
    foundMoves = [...new Set(foundMoves)];
    
    if (foundMoves.length > 0) {
      // Return the most likely move (prefer non-UCI notation)
      const sanMoves = foundMoves.filter(move => !move.match(/^[a-h][1-8][a-h][1-8]/));
      return sanMoves.length > 0 ? sanMoves[sanMoves.length - 1] : foundMoves[foundMoves.length - 1];
    }
    
    // Last resort: look for any chess-like pattern
    const lastResortPattern = /\b[a-h][1-8]|[NBRQK][a-h][1-8]|O-O/gi;
    const lastResortMatches = cleanResponse.match(lastResortPattern);
    
    if (lastResortMatches && lastResortMatches.length > 0) {
      const lastMove = lastResortMatches[lastResortMatches.length - 1];
      if (this.isValidMoveFormat(lastMove)) {
        return lastMove;
      }
    }
    
    throw new Error(`Could not parse valid chess move from AI response. Response: "${response.substring(0, 200)}..."`);
  }

  // Try to find the closest match in valid moves for a failed parse
  findClosestValidMove(response, validMoves) {
    if (!validMoves || validMoves.length === 0) return null;
    
    const cleanResponse = response.toLowerCase();
    
    // Look for exact matches first
    for (const move of validMoves) {
      if (cleanResponse.includes(move.toLowerCase())) {
        return move;
      }
    }
    
    // Look for partial matches (piece + destination)
    for (const move of validMoves) {
      const moveLower = move.toLowerCase();
      if (moveLower.length >= 2) {
        const destination = moveLower.slice(-2);
        const piece = moveLower[0];
        
        if (cleanResponse.includes(destination) || cleanResponse.includes(piece + destination)) {
          return move;
        }
      }
    }
    
    return null;
  }

  isValidMoveFormat(move) {
    if (!move || typeof move !== 'string') return false;
    
    const trimmedMove = move.trim();
    
    // Valid chess move patterns
    const validPatterns = [
      /^[a-h][1-8]$/,                                      // Simple pawn move: e4
      /^[a-h]x[a-h][1-8]$/,                               // Pawn capture: exd5
      /^[a-h][1-8]=[NBRQ][+#]?$/,                         // Pawn promotion: e8=Q
      /^[a-h]x[a-h][1-8]=[NBRQ][+#]?$/,                   // Pawn capture promotion: exd8=Q
      /^[NBRQK][a-h][1-8][+#]?$/,                         // Simple piece move: Nf3
      /^[NBRQK][a-h]?[1-8]?x[a-h][1-8][+#]?$/,           // Piece capture: Nxf3, Bxd5
      /^[NBRQK][a-h][a-h][1-8][+#]?$/,                    // Disambiguated move: Nbd2
      /^[NBRQK][1-8][a-h][1-8][+#]?$/,                    // Disambiguated move: N1f3
      /^O-O[+#]?$/,                                        // Kingside castling
      /^O-O-O[+#]?$/,                                      // Queenside castling
      /^[a-h][1-8][a-h][1-8][nbrq]?$/                     // UCI notation: e2e4
    ];
    
    return validPatterns.some(pattern => pattern.test(trimmedMove));
  }

  recordInvalidMove(move) {
    this.lastInvalidMove = move;
    this.invalidMoveCount++;
  }

  clearInvalidMove() {
    this.lastInvalidMove = null;
  }

  validateMoveAgainstList(move, validMoves) {
    if (!validMoves || validMoves.length === 0) {
      return false;
    }
    return validMoves.includes(move);
  }
}