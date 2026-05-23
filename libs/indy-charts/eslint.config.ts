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
        tsconfigRootDir: import.meta.dirname
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
      ]
    }
  },
  // Test files - keep no-explicit-any as a warning so structural mocks can
  // opt in deliberately; unsafe-* must stay off because vitest mocks return
  // `any`-typed values from the plugin's recommended config. Non-null
  // assertions are common in tests where mock fixtures are known to be
  // populated, so we allow them here only.
  {
    files: ["**/*.spec.ts"],
    plugins: vitest.configs.recommended.plugins,
    rules: {
      ...vitest.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/unbound-method": "off",
      "vitest/no-disabled-tests": "warn",
      "vitest/no-focused-tests": "warn",
      "vitest/no-identical-title": "error"
    }
  },
  // Ensure prettier formatting rules don't conflict
  prettier
);
