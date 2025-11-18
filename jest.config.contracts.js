/**
 * Jest Configuration for Contract Testing
 * Runs Pact contract tests for consumer and provider
 */

module.exports = {
  displayName: 'contract-tests',
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.pact.ts',        // Consumer tests
    '**/__tests__/**/*.verify.ts'       // Provider verification
  ],

  // Exclude regular unit tests
  testPathIgnorePatterns: [
    '/node_modules/',
    'src/__tests__/unit/',
    'src/__tests__/integration/'
  ],

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@client/(.*)$': '<rootDir>/../../client/src/$1'
  },

  // Transform
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true
        }
      }
    ]
  },

  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.contracts.ts'],

  // Timeouts (contract tests can be slow)
  testTimeout: 30000,

  // Verbose output for debugging
  verbose: true,

  // Parallel execution
  maxWorkers: '50%',

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'contract-tests-junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathAsClassname: false
      }
    ]
  ],

  // Globals
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },

  // Watch mode
  watchPathIgnorePatterns: [
    '/node_modules/',
    'pacts/'
  ]
};
