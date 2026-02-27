module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
  overrides: [
    {
      files: ['client/src/**/*.{ts,tsx}'],
      env: { browser: true },
    },
    {
      files: ['apps/backend/src/**/*.ts', 'server/**/*.ts'],
      env: { node: true },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'client/dist/',
    '**/*.js',
    '**/*.cjs',
    '**/*.mjs',
  ],
};
