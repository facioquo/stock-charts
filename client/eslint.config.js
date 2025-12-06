import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import prettier from "eslint-plugin-prettier/recommended";
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
      "prettier/prettier": [
        "error",
        {
          singleQuote: false,
          trailingComma: "none",
          bracketSpacing: true,
          arrowParens: "avoid"
        }
      ],
      quotes: ["error", "double", { avoidEscape: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/no-floating-promises": "error"
    }
  },
  // Test files - relaxed rules
  {
    files: ["**/*.spec.ts"],
    ...vitest.configs.recommended,
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "vitest/no-disabled-tests": "warn",
      "vitest/no-focused-tests": "warn",
      "vitest/no-identical-title": "error"
    }
  },
  // HTML templates
  {
    files: ["**/*.html"],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {}
  }
);
