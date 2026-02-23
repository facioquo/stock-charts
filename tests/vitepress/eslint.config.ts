import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**/*",
      ".vitepress/dist/**/*",
      ".vitepress/cache/**/*"
    ]
  },
  // VitePress config TypeScript files (no type-project since no root tsconfig)
  {
    files: [".vitepress/**/*.ts"],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "error"
    }
  },
  // Ensure prettier formatting rules don't conflict
  prettier
);
