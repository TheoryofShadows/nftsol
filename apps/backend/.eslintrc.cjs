module.exports = {
  root: true,
  env: { es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { project: false, ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': ['warn', { allow: ['error', 'warn', 'log'] }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['dist', 'node_modules', '*.js', 'apply-indexes.js', 'calculate-vault-ata.js', 'check-balance.js', 'create-bubblegum-tree.js', 'cursor-go-live.js', 'generate-platform-key.js', 'get-public-key.js']
};
