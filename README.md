# 🤖♟️ AI Chess Match System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2018.0.0-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

A comprehensive chess match system that allows two AI agents to play against each other, supporting multiple LLM providers including OpenAI, Anthropic Claude, and OpenRouter. Watch AI models battle it out on the chessboard with real-time visualization and detailed analytics.



## 🎯 **Quick Start**

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-chess-match.git
cd ai-chess-match

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start the server
npm start

# Open your browser to http://localhost:3000
```

## 📚 **Table of Contents**

- [Features](#-features)
- [Installation](#-installation)
- [API Keys Setup](#-api-keys-required)
- [Usage Guide](#-usage)
- [Performance Optimization](#-performance-optimization)
- [API Documentation](#-api-endpoints)
- [Architecture](#-architecture)
- [Development](#-development)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## ✨ **Features

- **Multi-LLM Support**: Play with GPT-4, Claude 4, Claude 3, Llama, and other models via OpenRouter
- **Live Chess Board**: Real-time visualization of the match with WebSocket updates  
- **AI Request Backlog**: View detailed logs of each AI's thinking process and API calls
- **FEN Position Support**: Analyze historical moves and positions
- **Performance Analytics**: Track thinking time, success rates, and API statistics
- **Game Configuration**: Easy setup of API keys and model selection per player
- **⚡ Performance Optimizations**: 
  - Fast Mode: 60-80% token reduction, 2-5x faster responses
  - Response Caching: 20-50x faster for repeated positions
  - Configurable analysis depth and token limits

## 🚀 **Installation**

### **Prerequisites**
- Node.js >= 18.0.0
- npm >= 8.0.0

### **Quick Install**
```bash
# Clone the repository
git clone https://github.com/yourusername/ai-chess-match.git
cd ai-chess-match

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env file with your API keys (see API Keys section)
nano .env

# Start the server
npm start
```

### **Development Setup**
```bash
# Install dev dependencies
npm install

# Run in development mode with auto-restart
npm run dev

# Run tests
npm test
```

The application will be available at `http://localhost:3000`

## API Keys Required

### OpenAI
- Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Supports: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo

### Anthropic Claude  
- Get your API key from [Anthropic Console](https://console.anthropic.com/)
- Supports: Claude Sonnet 4 (Latest), Claude 3 Opus, Claude 3 Sonnet, Claude 3 Haiku

### OpenRouter
- Get your API key from [OpenRouter](https://openrouter.ai/keys)
- Supports: Llama 2, additional Claude/GPT models, and many others

## Usage

1. **Setup Game**: 
   - Select models for White and Black players
   - Enter API keys for each player
   - Optionally set custom player names
   - Configure performance settings:
     - ⚡ **Fast Mode**: Shorter prompts, 2-5x faster responses
     - 🧠 **Include Analysis**: Detailed AI reasoning (slower)
     - 💾 **Use Cache**: 20-50x faster for repeated positions

2. **Start Match**:
   - Click "Create Game" to initialize
   - Click "Start Game" to begin AI vs AI match
   - Watch the live board update automatically

3. **Monitor Progress**:
   - View real-time game status and current turn
   - Check player statistics (move count, thinking time)
   - Browse move history in standard chess notation

4. **Analyze AI Behavior**:
   - Scroll through the AI Request Backlog to see:
     - Complete AI prompts sent to each model
     - Full AI responses with reasoning and analysis
     - Move parsing and validation results
     - API response times and performance metrics
     - Error handling and retry attempts
   - View separate entries for AI requests and actual moves made
   - Monitor success rates and thinking times per player
   - Export comprehensive logs for further analysis

## API Endpoints

- `GET /api/models` - List available AI models
- `POST /api/games` - Create new game with player configurations  
- `GET /api/games/:gameId` - Get current game state
- `GET /api/games/:gameId/backlog` - Get AI request logs and statistics
- `POST /api/games/:gameId/start` - Begin/resume AI match
- `POST /api/games/:gameId/reset` - Reset game to starting position
- `GET /api/games/:gameId/export` - Export game logs as JSON

## WebSocket Events

The system uses WebSockets for real-time updates:

- `game_update` - Board position and game state changes
- `ai_thinking` - When an AI is analyzing the position  
- `connection` - Initial connection confirmation

## Game Logs

All AI interactions are automatically logged including:

- Full prompts sent to each AI
- Complete responses with analysis
- API call duration and performance metrics
- Move history with timestamps
- Game events (start, reset, finish)

Logs are stored in `logs/game_[gameId].json` and can be exported via the web interface.

## Architecture

```
src/
├── ai/                 # AI player implementations
│   ├── AIPlayer.js     # Base AI player class
│   ├── AIPlayerFactory.js
│   └── providers/      # LLM-specific implementations
├── config/             # Model definitions and game configuration
├── game/               # Chess game engine with FEN support
├── logging/            # Request/response logging system  
├── server/             # Express server and WebSocket handling
└── index.js           # Main entry point

public/                 # Web interface
├── index.html         # Main UI
├── style.css          # Styling  
└── app.js            # Frontend JavaScript
```

## Development

Run in development mode with auto-restart:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

## ⚡ **Performance Optimization**

The system includes several optimization modes for different use cases:

### **Fast Mode (Recommended)**
- 60-80% token reduction
- 2-5x faster responses  
- Optimal for rapid games

### **Analysis Mode**
- Detailed AI reasoning
- Complete position analysis
- Better for educational purposes

### **Caching System**
- 15-30% cache hit rate
- 20-50x faster for repeated positions
- Automatic cleanup and LRU eviction

See [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md) for detailed optimization guide.

## 🏗️ **Architecture**

```
src/
├── ai/                     # AI player implementations
│   ├── AIPlayer.js         # Base AI player class
│   ├── AIPlayerFactory.js  # Factory for creating AI players
│   └── providers/          # LLM-specific implementations
│       ├── OpenAIPlayer.js
│       ├── AnthropicPlayer.js
│       └── OpenRouterPlayer.js
├── cache/                  # Response caching system
│   └── MoveCache.js        # Position-based caching
├── config/                 # Configuration management
│   ├── models.js           # Supported AI models
│   └── GameConfig.js       # Game configuration logic
├── game/                   # Chess game engine
│   └── ChessGame.js        # Chess logic with FEN support
├── logging/                # Request/response logging
│   └── GameLogger.js       # Comprehensive game logging
├── server/                 # Express server and WebSocket
│   └── GameServer.js       # Main server with API endpoints
└── index.js               # Application entry point

public/                     # Frontend assets
├── index.html             # Main UI
├── style.css              # Styling
└── app.js                 # Frontend JavaScript
```

## 👥 **Contributing**

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### **Quick Contribution Steps**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Run the linter: `npm run lint`
6. Submit a pull request

### **Development Guidelines**
- Follow ESLint configuration
- Add JSDoc comments for new functions
- Update tests for new features
- Update documentation for API changes

## 🛠️ **Development**

### **Running Tests**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "AIPlayer"

# Run tests with coverage
npm run test:coverage
```

### **Linting and Code Style**
```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Check code formatting
npm run format:check
```

### **Environment Variables**
```bash
# Required
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENROUTER_API_KEY=your_openrouter_key

# Optional
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
CACHE_SIZE=1000
CACHE_TTL=300000
```

## 📋 **Example Configurations**

### **Blitz Game (Fast)**
```json
{
  "optimizationSettings": {
    "fastMode": true,
    "includeAnalysis": false,
    "useCache": true,
    "maxTokens": 100,
    "temperature": 0.1
  }
}
```

### **Analysis Game (Detailed)**
```json
{
  "optimizationSettings": {
    "fastMode": false,
    "includeAnalysis": true,
    "useCache": true,
    "maxTokens": 800,
    "temperature": 0.3
  }
}
```

### **Educational/Demo**
```json
{
  "optimizationSettings": {
    "fastMode": false,
    "includeAnalysis": true,
    "useCache": false,
    "maxTokens": 1000,
    "temperature": 0.4
  }
}
```

## 🔧 **Troubleshooting**

### **Common Issues**

**Invalid API Key**
```bash
Error: Invalid API key for OpenAI
Solution: Check your .env file and verify the API key is correct
```

**Model Not Found**
```bash
Error: Model 'gpt-5' not found
Solution: Check supported models at /api/models endpoint
```

**Connection Timeout**
```bash
Error: Request timeout after 30s
Solution: Check your internet connection and API service status
```

**Chess Board Not Visible**
```bash
Issue: Board shows "loading..."
Solution: Check browser console for JavaScript errors, ensure ChessBoard.js loads
```

### **Debug Mode**
```bash
# Enable debug logging
DEBUG=chess:* npm start

# Check server logs
tail -f logs/server.log

# View game logs
ls logs/game_*.json
```

### **Performance Issues**
- Enable Fast Mode for quicker responses
- Use caching for repeated positions
- Choose faster models (Claude 3 Haiku, GPT-3.5 Turbo)
- Check network latency to API providers

## 📊 **API Response Times**

| Model | Fast Mode | Analysis Mode | Cache Hit |
|-------|-----------|---------------|-----------|
| Claude 3 Haiku | 0.8-1.5s | 2-4s | <50ms |
| GPT-3.5 Turbo | 1-2s | 3-5s | <50ms |
| Claude Sonnet 4 | 1.5-3s | 4-8s | <50ms |
| GPT-4 | 2-5s | 5-12s | <50ms |
| Claude 3 Opus | 3-8s | 8-20s | <50ms |

## 🎮 **Use Cases**

- **AI Research**: Compare different models' chess playing styles
- **Education**: Observe AI decision-making processes
- **Entertainment**: Watch epic AI battles
- **Development**: Test and benchmark LLM performance
- **Analysis**: Study chess positions with multiple AI perspectives

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- [chess.js](https://github.com/jhlywa/chess.js) for chess logic
- [chessboard.js](https://chessboardjs.com/) for board visualization
- OpenAI, Anthropic, and OpenRouter for AI model access
- The open source community for inspiration and tools

## 🔗 **Links**

- [Documentation](docs/)
- [Performance Guide](PERFORMANCE_OPTIMIZATION.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Issue Tracker](https://github.com/yourusername/ai-chess-match/issues)
- [Discussions](https://github.com/yourusername/ai-chess-match/discussions)
