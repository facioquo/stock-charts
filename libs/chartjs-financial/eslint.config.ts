import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  // TypeScript source and spec files
  {
    files: ["**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname as string
      }
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      // Allow /// <reference path="..."> for .d.ts module augmentation files
      // that cannot be imported with standard ES import syntax
      "@typescript-eslint/triple-slash-reference": ["error", { path: "always" }]
    }
  },
  // Test files - relaxed rules + vitest plugin
  {
    files: ["**/*.spec.ts"],
    ...vitest.configs.recommended,
    rules: {
      // preserve vitest recommended rules, then override specific entries
      ...vitest.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      // relax some vitest rules for local tests
      "vitest/no-disabled-tests": "warn",
      "vitest/no-focused-tests": "warn",
      "vitest/no-identical-title": "error"
    }
  },
  // Ensure prettier formatting rules don't conflict
  prettier
);
