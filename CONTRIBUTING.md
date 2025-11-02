# Contributing to NFTSol

Thank you for your interest in contributing to NFTSol! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/your-username/nftsol.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes**
5. **Test thoroughly**
6. **Commit with clear messages**
7. **Push and open a Pull Request**

## 📋 Development Guidelines

### Code Style

- **TypeScript**: Use strict mode, proper typing
- **Formatting**: Run `npm run format` before committing
- **Linting**: All lint checks must pass (`npm run lint`)
- **Naming**: Use clear, descriptive names

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new dashboard component
fix: Resolve wallet connection issue
docs: Update API documentation
perf: Optimize database queries
refactor: Clean up service layer
test: Add unit tests for NFT service
```

### Pull Request Process

1. **Update Documentation** - Update relevant docs for API/feature changes
2. **Add Tests** - Include tests for new features
3. **Update CHANGELOG.md** - Document your changes
4. **Ensure CI Passes** - All checks must pass
5. **Request Review** - Assign reviewers

## 🧪 Testing

### Backend Tests
```bash
cd apps/backend
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### Type Checking
```bash
# Backend
cd apps/backend && npm run type-check

# Frontend
cd client && npm run type-check
```

## 📝 Documentation

- **Code Comments**: Document complex logic
- **README Updates**: Update README for user-facing changes
- **API Docs**: Update TECHNICAL-DOCS.md for API changes
- **CHANGELOG**: Add entries for all changes

## 🔒 Security

- **Never commit secrets** - Use environment variables
- **Validate inputs** - All user inputs must be validated
- **Follow security best practices** - See SECURITY.md
- **Report vulnerabilities** - Use GitHub Security Advisories

## 🎯 Feature Development

### Before Starting
1. Check existing issues and PRs
2. Discuss major features in an issue first
3. Get approval for breaking changes

### Implementation Checklist
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] Environment variables documented
- [ ] Error handling implemented
- [ ] Security considerations addressed

## 🐛 Bug Reports

Use GitHub Issues with:
- Clear title
- Steps to reproduce
- Expected vs. actual behavior
- Environment details
- Screenshots (if applicable)

## 💡 Feature Requests

Open an issue with:
- Use case description
- Proposed solution
- Benefits
- Potential drawbacks

## 📦 Release Process

Releases are managed by maintainers:
1. Version bump in package.json
2. CHANGELOG.md update
3. Git tag creation
4. Release notes
5. Deployment

## 🤝 Code of Conduct

- Be respectful
- Welcome newcomers
- Focus on constructive feedback
- Follow the project's guidelines

## 📞 Questions?

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and discussions
- **Documentation**: See TECHNICAL-DOCS.md

Thank you for contributing to NFTSol! 🎉
