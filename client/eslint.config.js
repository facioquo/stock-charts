export default [
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      // Code quality rules to address common Codacy issues
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-unused-vars': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-duplicate-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { allowTemplateLiterals: true }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'no-mixed-spaces-and-tabs': 'error',
      'indent': ['error', 2, { SwitchCase: 1 }],
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-unused-expressions': 'error',
      'no-irregular-whitespace': 'error',
      'no-extra-semi': 'error',
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'curly': ['error', 'all'],
      'dot-notation': 'error',
      'eqeqeq': ['error', 'always'],
      'no-alert': 'warn',
      'no-empty-function': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-magic-numbers': ['warn', { ignore: [0, 1, -1] }],
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn'
    }
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      // Relax some rules for test files
      'no-magic-numbers': 'off',
      'no-unused-expressions': 'off'
    }
  }
];