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
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" }
      ],
      // Allow /// <reference path="..."> for .d.ts module augmentation files
      // that cannot be imported with standard ES import syntax
      "@typescript-eslint/triple-slash-reference": ["error", { path: "always" }]
    }
  },
  // Theme colors uses COLORS object with 'as const' which may have type safety trade-offs
  {
    files: ["theme/colors.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off"
    }
  },
  // Test files - keep `any` discouraged (warn) but allow non-null assertions
  // and unsafe-* operations that vitest mocks naturally produce.
  {
    files: ["**/*.spec.ts"],
    ...vitest.configs.recommended,
    rules: {
      ...vitest.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "off",
      "vitest/no-disabled-tests": "warn",
      "vitest/no-focused-tests": "warn",
      "vitest/no-identical-title": "error"
    }
  },
  // Ensure prettier formatting rules don't conflict
  prettier
);
