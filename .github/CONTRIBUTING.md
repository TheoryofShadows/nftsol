# Contributing to NFTSol

We appreciate your interest in contributing to NFTSol! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/nftsol.git
   cd nftsol
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/TheoryofShadows/nftsol.git
   ```

## Development Setup

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL 14+
- Git

### Installation

```bash
# Install all dependencies
npm run install:all

# Create environment files
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development servers
npm run dev
```

**Frontend:** http://localhost:5173
**Backend:** http://localhost:3001

## Making Changes

### Branch Naming
Follow conventional naming:
- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

<optional body>

<optional footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting)
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Test addition/fix
- `chore:` - Build/tool changes
- `security:` - Security fix

**Example:**
```
feat(nft): add video NFT minting support

Implements video NFT creation with AI verification
and IPFS storage integration.

Fixes #123
```

## Code Standards

### TypeScript
- Enable strict mode
- Use explicit return types on functions
- Avoid `any` type; use `unknown` or proper types
- PascalCase for components, classes, types
- camelCase for functions, variables
- UPPER_SNAKE_CASE for constants

### React Components
- Use function components with hooks
- Define props interface
- One component per file
- Use named exports

### Testing
- Write tests for new functionality
- Maintain test coverage above 80%
- Use descriptive test names
- Test behavior, not implementation

### Code Quality

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run format

# Tests
npm test

# Build
npm run build
```

## Pull Request Process

1. **Update your branch**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push your changes**:
   ```bash
   git push origin your-branch-name
   ```

3. **Create Pull Request**:
   - Use the PR template
   - Provide clear description
   - Link related issues
   - Include screenshots if applicable
   - Run all checks locally first

4. **Review Process**:
   - Address feedback promptly
   - Keep PR focused (one feature per PR)
   - Rebase and force-push if needed
   - Request re-review after changes

## Testing Requirements

Before submitting a PR:

```bash
# Run all tests
npm test

# Check types
npm run type-check

# Lint code
npm run lint

# Build project
npm run build

# Test locally
npm run dev
```

## Security

### Reporting Security Issues
**Do NOT create public GitHub issues for security vulnerabilities.**

Email security concerns to: security@nftsol.app

Include:
- Description of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Security Guidelines
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate all user inputs
- Follow OWASP security guidelines
- Review [SECURITY.md](../SECURITY.md) before coding

## Documentation

### When to Document
- New public APIs
- User-facing features
- Complex algorithms
- Configuration options
- Breaking changes

### Documentation Standards
- Use clear, concise language
- Include code examples
- Explain the "why" not just "what"
- Update relevant guides
- Check spelling and grammar

## Review Guidelines

### For Reviewers
- Test changes locally
- Check code quality and style
- Review test coverage
- Verify security practices
- Provide constructive feedback
- Approve when satisfied

### For Contributors
- Respond to reviews promptly
- Ask questions if feedback unclear
- Don't take criticism personally
- Suggest alternatives respectfully
- Thank reviewers for their time

## Troubleshooting

### Module not found
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Port already in use
```bash
# Find and kill process using port 3001 or 5173
npx kill-port 3001 5173
```

### TypeScript errors
```bash
npm run type-check
```

### Build failures
```bash
npm run clean
npm run build
```

## Resources

- [README.md](../README.md) - Project overview
- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
- [TECHNICAL-DOCS.md](../TECHNICAL-DOCS.md) - API documentation
- [SECURITY.md](../SECURITY.md) - Security policy
- [Discord/Community](https://discord.gg/nftsol) - Community chat

## Questions?

- Check existing issues and discussions
- Review documentation
- Ask in GitHub discussions
- Contact the team at hello@nftsol.app

Thank you for contributing to NFTSol! 🚀
