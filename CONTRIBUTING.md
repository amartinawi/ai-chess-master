# Contributing to AI Chess Match System

We love your input! We want to make contributing to AI Chess Match System as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 **Quick Start for Contributors**

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/ai-chess-match.git`
3. Create a branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Run tests: `npm test`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📋 **Development Process**

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### **Pull Requests**
Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code follows the existing style.
6. Issue that pull request!

### **Branch Naming Convention**
- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation updates
- `refactor/description` - for code refactoring
- `test/description` - for test improvements

## 🛠️ **Development Setup**

### **Prerequisites**
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### **Local Development**
```bash
# Clone your fork
git clone https://github.com/yourusername/ai-chess-match.git
cd ai-chess-match

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your API keys to .env

# Start development server
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

## 📝 **Coding Standards**

### **JavaScript Style Guide**
- Use ES6+ features
- Follow ESLint configuration
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused

### **Code Examples**

**Good:**
```javascript
/**
 * Creates a new AI player instance
 * @param {string} color - Player color ('white' or 'black')
 * @param {string} modelId - AI model identifier
 * @param {string} apiKey - API key for the model
 * @param {Object} options - Optional configuration
 * @returns {AIPlayer} Configured AI player instance
 */
function createAIPlayer(color, modelId, apiKey, options = {}) {
  return new AIPlayer(color, modelId, apiKey, options);
}
```

**Bad:**
```javascript
function create(c, m, k, o) {
  return new AIPlayer(c, m, k, o);
}
```

### **Commit Messages**
We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation changes
- `style:` formatting changes
- `refactor:` code refactoring
- `test:` adding tests
- `chore:` maintenance tasks

**Examples:**
```
feat: add Claude 4 model support
fix: resolve chess board visibility issue
docs: update API documentation
refactor: optimize AI prompt generation
```

## 🧪 **Testing**

### **Test Structure**
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── fixtures/       # Test data
└── helpers/        # Test utilities
```

### **Writing Tests**
```javascript
import { expect } from 'chai';
import { AIPlayer } from '../src/ai/AIPlayer.js';

describe('AIPlayer', () => {
  it('should create player with correct color', () => {
    const player = new AIPlayer('white', 'gpt-4', 'test-key', 'openai');
    expect(player.color).to.equal('white');
  });
});
```

### **Running Tests**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- --grep "AIPlayer"

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## 🐛 **Bug Reports**

Great Bug Reports tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]
- Node.js version
- npm version

**Additional context**
Any other context about the problem.
```

## 💡 **Feature Requests**

We'd love to hear your ideas! Please open an issue with:

- **Feature Description**: What you want to achieve
- **Use Case**: Why this feature would be useful
- **Proposed Solution**: How you think it should work
- **Alternatives**: Other solutions you've considered

## 🔍 **Code Review Process**

1. **Automated Checks**: All PRs must pass automated tests and linting
2. **Manual Review**: At least one maintainer will review your code
3. **Testing**: We may ask you to add tests for new features
4. **Documentation**: Update docs if you change APIs

### **Review Checklist**
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or properly documented)
- [ ] Performance implications considered
- [ ] Security implications considered

## 📚 **Documentation**

### **Types of Documentation**
- **README.md**: Getting started guide
- **API Documentation**: In-code JSDoc comments
- **Architecture Docs**: High-level system design
- **Performance Guides**: Optimization recommendations

### **Writing Documentation**
- Use clear, concise language
- Include code examples
- Add screenshots for UI changes
- Keep it up to date with code changes

## 🏗️ **Architecture Guidelines**

### **Project Structure**
- Keep related files together
- Use clear, descriptive names
- Separate concerns (AI, game logic, UI)
- Follow established patterns

### **Adding New Features**

**AI Providers:**
```javascript
// 1. Extend AIPlayer base class
export class NewAIPlayer extends AIPlayer {
  async callAI(prompt) {
    // Implementation
  }
}

// 2. Add to AIPlayerFactory
// 3. Update models.js configuration
// 4. Add tests
```

**API Endpoints:**
```javascript
// 1. Add route to GameServer.js
this.app.get('/api/new-feature', (req, res) => {
  // Implementation
});

// 2. Add frontend integration
// 3. Update API documentation
// 4. Add integration tests
```

## 🚀 **Performance Considerations**

- **Caching**: Consider cache implications
- **API Calls**: Minimize unnecessary requests
- **Memory Usage**: Monitor memory leaks
- **Response Times**: Keep user experience smooth
- **Token Usage**: Optimize for cost efficiency

## 🔐 **Security Guidelines**

- **API Keys**: Never commit API keys
- **Input Validation**: Validate all user inputs
- **Error Handling**: Don't expose sensitive info
- **Dependencies**: Keep dependencies updated
- **CORS**: Configure properly for production

## 🎯 **Good First Issues**

Looking for a way to contribute? Check out issues labeled `good first issue`:

- Documentation improvements
- Adding test cases
- UI/UX enhancements
- Bug fixes
- Performance optimizations

## 📞 **Getting Help**

- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord (if available)
- **Email**: Contact maintainers directly

## 📜 **Code of Conduct**

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🎉 **Recognition**

Contributors will be:
- Listed in our README
- Credited in release notes
- Invited to maintainer team (for significant contributions)
- Featured in community highlights

## 📄 **License**

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to AI Chess Match System! 🚀♟️