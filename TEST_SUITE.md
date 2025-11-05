# 🧪 Complete Test Suite - NFTSol Stack

## Overview

Comprehensive test suite covering:
- **Backend**: Unit, Integration, E2E tests
- **Frontend**: Component, Integration, E2E tests
- **API**: Video upload, Grok verification, Echo features
- **Utilities**: Pinata, Irys, Grok integrations

## Test Structure

```
apps/backend/src/__tests__/
├── setup.ts                    # Jest configuration
├── unit/
│   ├── pinataUpload.test.ts    # Pinata upload utility tests
│   ├── irysUpload.test.ts      # Irys metadata upload tests
│   └── grokpedia-production.test.ts  # Grok verification tests
├── integration/
│   └── video-upload.test.ts    # Video upload API integration
└── e2e/
    └── video-flow.test.ts       # End-to-end video workflow

client/src/__tests__/
├── setup.ts                    # Vitest configuration
├── unit/
│   └── VideoUpload.test.tsx    # VideoUpload component tests
└── integration/
    └── video-upload-flow.test.tsx  # Frontend integration tests
```

## Running Tests

### Backend Tests

```bash
cd apps/backend

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Frontend Tests

```bash
cd client

# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

## Test Coverage

### Backend Coverage Goals
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows

### Frontend Coverage Goals
- **Component Tests**: All major components
- **Integration Tests**: User workflows
- **E2E Tests**: Complete user journeys

## Test Categories

### 1. Unit Tests

**Backend:**
- ✅ Pinata upload utility
- ✅ Irys metadata upload
- ✅ Grok verification
- ✅ Error handling
- ✅ Input validation

**Frontend:**
- ✅ VideoUpload component
- ✅ Component rendering
- ✅ User interactions
- ✅ Error states

### 2. Integration Tests

**Backend:**
- ✅ Video upload endpoint
- ✅ File validation
- ✅ Rate limiting
- ✅ Error responses
- ✅ Grok verification integration

**Frontend:**
- ✅ Video upload flow
- ✅ API integration
- ✅ State management
- ✅ Error handling

### 3. End-to-End Tests

**Backend:**
- ✅ Complete video upload workflow
- ✅ Pinata → Irys → Grok flow
- ✅ Echo video layer integration

**Frontend:**
- ✅ Upload → Mint → View flow
- ✅ User journey testing
- ✅ Cross-component interactions

## Test Data & Mocking

### Mock Data
- Test video files (small buffers)
- Mock API responses
- Mock Solana wallet addresses
- Mock Pinata/Irys responses

### Mock Services
- Pinata API (axios mocks)
- Irys SDK (class mocks)
- Grok API (axios mocks)
- Solana connection (connection mocks)

## Environment Setup

### Backend Test Environment
```env
NODE_ENV=test
PORT=3001
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
PINATA_JWT=test-pinata-jwt
XAI_API_KEY=test-xai-api-key
PLATFORM_SECRET_KEY_BASE58=test-secret-key
```

### Frontend Test Environment
```env
VITE_API_BASE=http://localhost:3001
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd apps/backend && npm install && npm test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd client && npm install && npm test
```

## Test Commands Reference

### Backend
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # E2E tests only
npm run test:watch        # Watch mode
```

### Frontend
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
npm test -- --ui           # UI mode
```

## Coverage Reports

### Backend
- Location: `apps/backend/coverage/`
- HTML report: `coverage/index.html`
- LCOV report: `coverage/lcov.info`

### Frontend
- Location: `client/coverage/`
- HTML report: `coverage/index.html`

## Adding New Tests

### Backend Test Template
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should test behavior', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Frontend Test Template
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component Name', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});
```

## Test Best Practices

1. **Isolation**: Each test should be independent
2. **Mocking**: Mock external services (APIs, databases)
3. **Coverage**: Aim for 80%+ code coverage
4. **Naming**: Use descriptive test names
5. **Speed**: Keep tests fast (< 30s total)
6. **CI/CD**: Run tests on every push

## Troubleshooting

### Backend Tests Fail
- Check environment variables are set
- Verify mocks are properly configured
- Check database connection (if needed)

### Frontend Tests Fail
- Verify jsdom environment is set
- Check React Testing Library setup
- Verify mocks for external dependencies

### Coverage Issues
- Check coverage thresholds in config
- Verify all files are included
- Check for untested branches

## Next Steps

1. ✅ Add more unit tests for edge cases
2. ✅ Add E2E tests for Echo features
3. ✅ Add performance tests
4. ✅ Add load tests for video upload
5. ✅ Add security tests

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Supertest](https://github.com/visionmedia/supertest)

