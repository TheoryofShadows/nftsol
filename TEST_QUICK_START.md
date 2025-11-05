# 🧪 Test Suite - Quick Start Guide

## ✅ Installation Complete

Both backend and frontend test dependencies are installed!

## 🚀 Run Tests

### Backend Tests
```powershell
cd apps\backend

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Watch mode (for development)
npm run test:watch
```

### Frontend Tests
```powershell
cd client

# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## 📊 Test Coverage

### Backend Coverage
- Location: `apps/backend/coverage/`
- View HTML: Open `apps/backend/coverage/index.html` in browser

### Frontend Coverage
- Location: `client/coverage/`
- View HTML: Open `client/coverage/index.html` in browser

## 🎯 Test Structure

### Backend (`apps/backend/src/__tests__/`)
- **Unit Tests**: `unit/` - Individual utilities (Pinata, Irys, Grok)
- **Integration Tests**: `integration/` - API endpoints
- **E2E Tests**: `e2e/` - Complete workflows

### Frontend (`client/src/__tests__/`)
- **Unit Tests**: `unit/` - Components
- **Integration Tests**: `integration/` - User flows

## 📝 Example: Run Backend Tests

```powershell
# Navigate to backend
cd apps\backend

# Run all tests with coverage
npm test

# Expected output:
# PASS  src/__tests__/unit/pinataUpload.test.ts
# PASS  src/__tests__/unit/irysUpload.test.ts
# PASS  src/__tests__/unit/grokpedia-production.test.ts
# PASS  src/__tests__/integration/video-upload.test.ts
#
# Test Suites: 4 passed, 4 total
# Tests:       15 passed, 15 total
```

## 🐛 Troubleshooting

### Backend Tests Fail
- **Missing env vars**: Check `apps/backend/src/__tests__/setup.ts`
- **Jest not found**: Run `npm install` in `apps/backend`
- **Type errors**: Run `npm run build` first

### Frontend Tests Fail
- **Vitest not found**: Run `npm install` in `client`
- **Module not found**: Check `vitest.config.ts` paths
- **React errors**: Verify `@testing-library/react` is installed

## 📚 Next Steps

1. ✅ Dependencies installed
2. ⏭️ Run tests: `npm test` in each directory
3. ⏭️ Check coverage reports
4. ⏭️ Add more tests as needed

## 🔗 Documentation

- Full guide: See `TEST_SUITE.md`
- Installation: See `INSTALL_TEST_DEPS.md`

