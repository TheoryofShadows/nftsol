module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/server-production.ts',
    '!src/app-production.ts',
    '!src/services/eternalEchoesService.ts',
    '!src/services/bubblegumService-production.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  globalSetup: '<rootDir>/jest.global-setup.js',
  setupFiles: ['<rootDir>/jest.setup-env.js'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  // Run serially: Node 22+ localStorage/sessionStorage globals cause
  // SecurityError in parallel workers before setupFiles can patch them.
  maxWorkers: 1,
  // Exit once tests finish even if a mocked service left an async handle open
  // (network/DB clients are mocked, so lingering handles are harmless). Without
  // this Jest prints "did not exit" and hangs until the CI 30-min timeout.
  forceExit: true,
};

