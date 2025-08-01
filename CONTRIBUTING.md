# Contributing to Pet Accessories Chatbot API

Thank you for your interest in contributing to our project! This document provides guidelines and
information for contributors.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/ai-challenge.git
   cd ai-challenge
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## 🛠️ Development Workflow

### Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

Example: `feature/add-product-recommendations`

### Making Changes

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Run tests** to ensure everything works:

   ```bash
   npm test
   npm run lint
   ```

4. **Commit your changes** with descriptive messages:

   ```bash
   git commit -m "feat: add product recommendation engine"
   ```

5. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## 📝 Code Standards

### Code Style

- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Write descriptive variable and function names
- Add comments for complex logic

### Testing

- Write tests for new features
- Maintain test coverage above 80%
- Test both success and error scenarios
- Use descriptive test names

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example: `feat(chat): add fuzzy search for product queries`

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place tests in `src/__tests__/` directory
- Use descriptive test names
- Test edge cases and error conditions
- Mock external dependencies

### Test Structure

```javascript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // Test implementation
    });

    it('should throw error when invalid input provided', () => {
      // Error test implementation
    });
  });
});
```

## 📚 Documentation

### API Documentation

- Update API examples in `src/requests/`
- Document new endpoints in README
- Include request/response examples

### Code Documentation

- Add JSDoc comments for functions
- Document complex algorithms
- Explain business logic decisions

## 🔍 Code Review Process

### Before Submitting PR

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] No console.log statements left
- [ ] Environment variables documented

### PR Requirements

- **Clear title** describing the change
- **Detailed description** of what was changed and why
- **Link to related issues** if applicable
- **Screenshots** for UI changes
- **Breaking changes** clearly marked

### Review Criteria

- Code quality and maintainability
- Test coverage and quality
- Performance implications
- Security considerations
- Documentation completeness

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment details** (Node.js version, OS, etc.)
2. **Steps to reproduce** the issue
3. **Expected vs actual behavior**
4. **Error messages** and stack traces
5. **Minimal code example** if applicable

## 💡 Feature Requests

For new features, please:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** and problem being solved
3. **Propose a solution** or approach
4. **Consider backward compatibility**
5. **Discuss implementation** before starting work

## 🚨 Security

- Report security vulnerabilities privately
- Don't commit sensitive information
- Use environment variables for secrets
- Follow authentication best practices

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **Discussions** - For questions and general discussion
- **Code Review** - During the PR process

## 🎉 Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes for significant contributions
- README acknowledgments section

Thank you for contributing to make this project better! 🐾
