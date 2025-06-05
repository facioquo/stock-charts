import typescriptParser from '@typescript-eslint/parser';

export default [
  // Apply to all files
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  },
  
  // TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly'
      }
    },
    rules: {
      // Basic code quality rules
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
      'eqeqeq': ['error', 'always'],
      'no-undef': 'off', // TypeScript handles this
      'no-unused-vars': 'off' // TypeScript handles this
    }
  },
  
  // JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        require: 'readonly',
        global: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { allowTemplateLiterals: true }]
    }
  }
];