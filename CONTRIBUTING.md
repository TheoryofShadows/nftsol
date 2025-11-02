# Contributing to NFTSol

Thank you for your interest in contributing to NFTSol! This document provides guidelines and instructions for contributing.

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
4. **Create a branch** for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Backend Development

```bash
cd apps/backend
npm install
npm run dev
```

### Frontend Development

```bash
cd client
npm install
npm run dev
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Follow existing code patterns
- Use explicit types where helpful
- Avoid `any` type

### React/Component Guidelines

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use lazy loading for large components

### Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Example:
```bash
git commit -m "feat: add new dashboard stats component"
```

## Pull Request Process

1. **Update your branch** from upstream:
   ```bash
   git checkout main
   git pull upstream main
   git checkout feature/your-feature-name
   git rebase main
   ```

2. **Ensure all checks pass**:
   - Tests pass
   - Linting passes (`npm run lint`)
   - Type checking passes (`npm run type-check`)
   - Build succeeds

3. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Open a Pull Request** on GitHub

## Testing

- Write tests for new features
- Ensure existing tests pass
- Add integration tests for API endpoints

## Documentation

- Update README.md if adding new features
- Update TECHNICAL-DOCS.md for API changes
- Add JSDoc comments for new functions/classes

## Questions?

- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review code examples in the codebase

Thank you for contributing! 🎉
