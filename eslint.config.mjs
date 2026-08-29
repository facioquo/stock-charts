import eslint from "@eslint/js";
import globals from "globals";

/**
 * Root config — covers the Node build/utility scripts in `scripts/` only.
 *
 * Every workspace package owns its own `eslint.config.ts` and is linted from
 * its own directory, so this config deliberately ignores them: a root run must
 * not shadow a package's stricter, type-checked rules.
 *
 * Replaces the former `.eslintrc.json`, which ESLint 10 ignored entirely
 * (eslintrc support was removed), leaving these scripts unlinted.
 */
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "web/**",
      "libs/**",
      "server/edge/**",
      "tests/**"
    ]
  },
  {
    files: ["scripts/**/*.{js,cjs,mjs}"],
    ...eslint.configs.recommended,
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: globals.node
    },
    rules: {
      ...eslint.configs.recommended.rules,
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  },
  {
    files: ["scripts/**/*.cjs"],
    languageOptions: { sourceType: "commonjs" }
  }
];
