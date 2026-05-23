import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import prettier from "eslint-config-prettier";
import vitest from "@vitest/eslint-plugin";

export default tseslint.config(
  {
    ignores: ["projects/**/*", "dist/**/*", ".angular/**/*", "node_modules/**/*"]
  },
  // TypeScript files
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
      prettier
    ],
    languageOptions: {
      globals: {
        console: "readonly"
      },
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        sourceType: "module"
      }
    },
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase"
        }
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case"
        }
      ],
      quotes: ["error", "double", { avoidEscape: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" }
      ],
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "@facioquo/chartjs-chart-financial",
            "@facioquo/chartjs-chart-financial/*",
            "**/assets/js/chartjs-chart-financial",
            "**/assets/js/chartjs-chart-financial.js"
          ]
        }
      ]
    }
  },
  // Test files - relax `any` only where structural mocks can't be cleanly
  // typed; keep type-import consistency and unnecessary-assertion checks.
  {
    files: ["**/*.spec.ts"],
    plugins: vitest.configs.recommended.plugins,
    rules: {
      ...vitest.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "vitest/no-disabled-tests": "warn",
      "vitest/no-focused-tests": "warn",
      "vitest/no-identical-title": "error"
    }
  },
  // HTML templates
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility, prettier],
    rules: {}
  }
);
