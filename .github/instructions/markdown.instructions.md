---
applyTo: "**/*.md"
description: "Guidelines for writing and formatting Markdown files"
---

# Markdown formatting rules

## Required formatting

**Headers:**

- ATX-style (`#` not underlines), space after marker (`# Title`)
- **🚨 CRITICAL: Always use sentence case only** (first word + proper nouns capitalized)
  - ❌ **DON'T**: `### Workspace Structure`, `## Code Quality Standards`
  - ✅ **DO**: `### Workspace structure`, `## Code quality standards`
  - This applies to ALL headers, including subsections and bullet point headers
- **🚨 CRITICAL: Pseudo-headers (bold text acting as headers) also use sentence case**
  - ❌ **DON'T**: `**My Pseudo-Thing** (automatically suggested):`
  - ✅ **DO**: `**My pseudo-thing** (automatically suggested):`
  - Proper nouns retain title case: `**Notes from Dave Skender**`
- Sequential hierarchy (no h1→h3 jumps), blank lines before/after

**Code blocks:**

- Language-specified fenced blocks: ````markdown for markdown content
- Inline code spans for: commands, file paths, variable names
- Blank lines surrounding code blocks

**Lists:**

- **Always use hyphens (`-`), never asterisks (`*`)**
- 2-space indentation per nesting level
- Consistent markers throughout document
- **🚨 CRITICAL: Bold text in lists also uses sentence case**
  - ❌ **DON'T**: `- **Root Workspace**: description`
  - ✅ **DO**: `- **Root workspace**: description`

**Required elements:**

- Alt text for all images
- Single blank line at file end
- No trailing line spaces

**Links:**

- Fix all broken internal links
- Use reference-style for complex documents

## Content organization and deduplication

### 🚫 CRITICAL: avoid content duplication across documentation files

This repository maintains multiple documentation files with specific purposes. **Never duplicate content** - use cross-references instead:

### Documentation hierarchy

1. **`README.md` (main)** - Primary project documentation
   - Project overview and live demo
   - Complete development setup
   - Technical architecture and configuration
   - Code quality standards

2. **`docs/contributing.md`** - Contributor guidelines only
   - Contribution process and requirements
   - Code quality requirements
   - Cross-references to README.md for technical setup
   - Contact information

3. **`server/Functions/README.md`** - Azure Functions specifics only
   - Functions-specific configuration (CRON, environment variables)
   - Cross-references to main README for general setup

4. **`.github/instructions/*.md`** - Development guidelines
   - Framework-specific rules (Angular, npm, NuGet)
   - AI coding assistant instructions

### Cross-referencing rules

**Instead of duplicating content:**

✅ **DO**: Use relative links to reference detailed information

```markdown
For complete setup instructions, see [Development Setup](../../README.md).
```

✅ **DO**: Provide summary with link to details

```markdown
1. **Clone and setup** (see [main README](../../README.md) for details)
```

❌ **DON'T**: Copy entire sections between files
❌ **DON'T**: Duplicate build/setup instructions
❌ **DON'T**: Repeat code examples or configuration details

### Cross-reference link formats

- **Main README from .github/instructions/**: `../../README.md#section-name`
- **Main README from docs/**: `../README.md#section-name`
- **Contributing from main**: `docs/contributing.md`
- **Functions README from main**: `server/Functions/README.md`
- **Between instruction files**: `./filename.md` or `../path/filename.md`

### Content update guidelines

**When adding new features or setup steps:**

1. Add comprehensive details to the main README.md
2. Update cross-references in other files if needed
3. **Never duplicate** the new content across multiple files

**When updating existing information:**

1. Update the canonical source (usually main README.md)
2. Verify all cross-references still point to correct sections
3. Run `npm run lint:md` to check for broken links

## Linting and standards

- Use `npm run lint:md` to identify non-compliant formatting
- Use `npm run lint:md:fix` to auto-fix formatting issues
- Linting configuration is in the `.markdownlint.json` file
- We use npm packages `markdownlint` and `markdownlint-cli`

**Current linting rules:**

- `MD013: false` - Line length limit disabled (due to long URLs and code examples)
- `MD033: false` - HTML allowed (for GitHub features like `<details>`)
- `MD041: false` - First line doesn't need to be H1 (instruction files have frontmatter)

## Repository-specific rules

**File naming:**

- Use lowercase with hyphens: `contributing.md`, `azure-functions.md`
- Be descriptive: `npm-packages.instructions.md` not `npm.md`

**Content focus:**

- Each file should have a single, clear purpose
- Avoid mixing different domains (frontend + backend setup)
- Keep instruction files focused on their specific technology

**Code examples:**

- Use realistic examples from this project when possible
- Show actual file paths: `server/Functions/README.md`
- Include workspace-aware commands: `npm run build --workspace=@stock-charts/client`

### Stock Charts specific files

- **`README.md`** - Main project documentation and setup
- **`docs/contributing.md`** - Contributor guidelines and workflow
- **`server/Functions/README.md`** - Azure Functions configuration
- **`.github/instructions/`** - AI assistant and framework-specific guidelines
- **`.github/copilot-instructions.md`** - GitHub Copilot project context

## GitHub features (when appropriate)

**Collapsible sections:** `<details><summary>Title</summary>Content</details>`

**Task lists:** `- [x] Done` / `- [ ] Todo`

**Alerts:** `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`

**Tables:** Pipe-delimited with header separators

**Diagrams:** Mermaid code blocks for flowcharts/diagrams

Rules for Mermaid diagrams:

- Use GitHub flavored syntax. For example, you must use `B["POST /user/facts/{factKey}"]` instead of `B[POST /user/facts/{factKey}]`
- Do not use background fill colors like `style AC fill:#e1f5fe`. If colors are needed for differentiation, only color element borders

---

Last updated: August 15, 2025
