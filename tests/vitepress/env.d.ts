// Extends ImportMeta with Vite's env property for type-safe environment variable access.
// VitePress uses Vite under the hood; this declaration makes `import.meta.env` available
// to the TypeScript language server without requiring vite as a direct dependency.
interface ImportMeta {
  readonly env: Record<string, string | undefined>;
}
