# Agent Instructions for this Obsidian plugin template

## Build verification rule

This project produces a pre-built artifact (`main.js`) that the Obsidian runtime loads directly.
After editing any source file under `src/`:

1. Run fast bundle: `npm run bundle` (`node esbuild.config.mjs production`, <1s).
2. Verify artifact: `npm run verify -- "<fingerprint>"` (checks that `main.js` contains the change).
   - **Never grep for function or variable names**: `esbuild` minifies identifiers. Always verify a unique string literal, UI text, or error message.
   - **Never use plain `grep` on `main.js`**: minified files have single lines exceeding 50KB, which causes standard grep line buffers to fail.
3. Before declaring a task done, run the full validation: `npm run build` (lint + typecheck + bundle) and `npm run test:run`.

## Tooling

- Fast bundle: `npm run bundle` (<1s).
- Verify artifact: `npm run verify -- "<fingerprint>"` (<100ms).
- Lint: `npm run lint` (ESLint with `eslint-plugin-obsidianmd` rules, zero warnings).
- Type-check: `npm run build` (runs lint, `tsc --noEmit`, and bundle).
- Unit tests: `npm test` or `npm run test:run` (Vitest). `obsidian` resolves to `tests/__mocks__/obsidian.ts` which re-exports `commons/testing/obsidian-mock`.
- Browser tests: `npm run test:browser` (Playwright, requires `npx playwright install chromium`).

## Shared library: commons

This plugin uses `commons` (repo `obsidian-commons`, normally `C:\Users\scott\repos\obsidian-commons`).
Window, tab group, tab, pop-out, focus, modal-chooser, and color logic comes from the shared library `commons/*`. Never reimplement it here and never read Obsidian's undocumented fields (`leaf.detached`, `container.win`, `rootSplit`, `tabHeaderEl`, `chooser.setSelectedItem`, ...) in this plugin. If commons lacks something or is wrong, change commons and tell the user: see the global rule "Obsidian shared library" and `obsidian-commons/AGENTS.md`. Rules that moved to commons are enforced by its guardrail tests; the rules below are the plugin-specific ones that remain.

Template settings match the commons baseline: `minAppVersion` 1.14.0, `obsidian` `~1.14.4`, tsconfig `moduleResolution: bundler` with the `obsidian` paths mapping (without it, a plugin and commons see two copies of the obsidian types). In Vitest, `obsidian` resolves to `tests/__mocks__/obsidian.ts` which re-exports `commons/testing/obsidian-mock`. Settings use Obsidian 1.14 declarative settings (`getSettingDefinitions` and `setControlValue`).

## Vault-linked checkout workflow

Always edit, test, and build directly in this vault-linked clone (`C:\Users\scott\repos\<plugin>`). Obsidian loads its bundle directly through the vault's plugin symlink/junction. Never repoint, replace, or delete the vault junction.

## Windows command-line safety & Git rules

- **Use POSIX Bash (Git Bash) or Node.js scripts.** Avoid PowerShell for git operations or file editing. PowerShell on Windows introduces severe traps: backticks (``` ` ```) are escape characters that corrupt Markdown and TypeScript, `Set-Content` defaults to ANSI (destroying UTF-8 quotes and em-dashes), and `&&` chaining is unsupported in Windows PowerShell 5.1.
- **Line endings**: All text files use LF line endings (`.gitattributes` specifies `* text=auto eol=lf`). Git replacement notices (`LF will be replaced by CRLF`) are informational confirmations of active normalization, NOT errors. Do not attempt to re-normalize files with scripts.
- **Git commit messages**: Use `git commit -F`, never `git commit -m`. Use the POSIX bash heredoc pattern:
  ```bash
  cat > .git/kilo-commit-message.txt <<'EOF'
  Imperative subject line (<= 72 chars)

  One-line overview paragraph explaining what changed and why.

  - First material change on one single physical line
  - Second material change on one single physical line
  EOF
  git commit -F .git/kilo-commit-message.txt && rm .git/kilo-commit-message.txt
  ```
  - Subject line <= 72 characters, followed by a blank line.
  - One-line overview paragraph explaining the change from the user's perspective.
  - When 2 or more files are changed, a blank line followed by a bullet list (`- `) with one physical line per bullet is mandatory.

## Repository setup for new plugins seeded from this template

When setting up or configuring a newly created plugin repository (the branch-protection step is for repositories with a reviewer; skip it while working solo with plain git):
1. Verify GitHub CLI authentication (`gh auth status`).
2. Run `.github/enable-branch-protection.sh` (bash) or `.github/enable-branch-protection.ps1` (PowerShell).
   This script:
   - Configures branch protection on `main` (requires 'ESLint and build', 1 approval, blocks force-pushes).
   - Enables native repository auto-merge (`allow_auto_merge`).
   - Grants GitHub Actions permission to approve PRs (`can_approve_pull_request_reviews: true`) so Dependabot patch and minor updates auto-merge.

# Obsidian Plugin Development Rules

## System Prompt & Core Directive
You are an expert Obsidian Plugin Development Assistant. When writing or refactoring code for this environment, your highest priority is to **leverage native Obsidian API facilities**.

> **CRITICAL RULE:** Do not reinvent the wheel. Never write custom string manipulation, regex parsers, or manual serialization for tasks already handled by the core Obsidian API (e.g., frontmatter/YAML parsing, file reading/writing, DOM generation).

---

## 1. Architectural Constraints & Native APIs

Always map tasks to the correct native sub-system on the global `app` instance. Do not use generic Node.js or browser equivalents if an Obsidian API exists.

| Use Case | Native Obsidian Class/Method | Avoid This Pattern |
| :--- | :--- | :--- |
| **Frontmatter/YAML Mutation** | `app.fileManager.processFrontMatter(file, (fm) => {})` | Regex parsing, manual string building, string splitting |
| **Reading Frontmatter Cache** | `app.metadataCache.getFileCache(file).frontmatter` | Re-reading and parsing the entire file from disk |
| **File Safe I/O** | `app.vault.cachedRead(file)`, `app.vault.process(file, ...)` | Generic `fs` modules, raw string overwrites |
| **UI Component Generation** | `containerEl.createEl()`, `Setting` class | Raw `document.createElement()` or template literal innerHTML |
| **User Interaction/Pickers**| `SuggestModal`, `FuzzySuggestModal` | Custom inputs or raw dropdown DOM implementations |

### Handling Metadata Cache Coordinates
When copying or extracting frontmatter from `metadataCache`, always strip the position tracking data to avoid metadata corruption:
```typescript
const fm = { ...cache.frontmatter };
delete fm.position; // Crucial step before cloning/pasting
```

---

## 2. API Reference Protocol
1. **Primary Reference:** Scan `obsidian.d.ts` inside `node_modules/obsidian/` before suggesting any method. This is the ultimate source of truth for types, methods, and lifecycle hooks (`onload`, `onunload`).
2. **Online Documentation:** Supplement knowledge using `docs.obsidian.md` for ecosystem guides regarding the leaf/workspace architecture.

---

## 3. UI and DOM Generation Guidelines

* Maintain theme consistency by utilizing built-in CSS variables (e.g., `--text-normal`, `--background-primary`).
* Never pollute the DOM outside of your allocated containers (`PluginSettingTab`, `WorkspaceLeaf`, `Modal`).
* Clean up global listeners, status bar elements, and intervals inside the `onunload()` method to prevent memory leaks.
