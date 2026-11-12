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

## Settings tabs

- Use the declarative settings API only: `getSettingDefinitions()` plus `getControlValue`/`setControlValue` for custom storage.
- Never define `display()` in a `PluginSettingTab`. Obsidian 1.13 deprecated it and does not call it when `getSettingDefinitions()` returns a non-empty array.
- Never build settings rows with `new Setting()` inside the settings tab; use `control` entries or `render` callbacks. `new Setting()` is fine in modals.
- Refresh dynamic rows with `this.update()`, not `this.display()`.
- Keep `obsidianmd/settings-tab/no-deprecated-display`, `prefer-setting-definitions`, and `prefer-update-over-display` enabled in ESLint.

## Vault-linked checkout workflow

Always edit, test, and build directly in this cloned repository. If the vault's
plugin entry is linked to this repository, this repository root is the plugin
directory Obsidian loads, so `main.js` here is the file Obsidian loads.

Never search for the vault and never mention a vault path. Verify the artifact
only inside this repository: build, check that `main.js` is fresh, check a unique
literal, and state its absolute path. Never repoint, replace, or delete the vault
link, and never change it to expose a worktree.

## Windows command-line safety & Git rules

- **Detect the shell once, then stay in it.** Before the first command, run `printf 'shell=%s\n' "$BASH_VERSION"`. If it prints a version, write POSIX commands directly with no launcher. If it prints nothing, the host is PowerShell: do not write PowerShell; use `& "C:\Program Files\Git\bin\bash.exe" -lc '<command>'` for each command, or ask the user to set the host shell to Git Bash. Never author PowerShell cmdlets, `$env:`, `Set-Content`/`Out-File`, backtick escapes, `powershell`/`pwsh`/`-EncodedCommand`, or `.ps1` scripts.
- **Resolve a POSIX shell in order:** Git Bash (`C:\Program Files\Git\bin\bash.exe`, then `C:\Program Files\Git\usr\bin\bash.exe`), MSYS2 (`C:\tools\msys64\usr\bin\bash.exe`), Cygwin, then WSL only when `wsl.exe -l -q` lists a distribution. Probe each with `-lc 'echo ok'`. If you use a fallback, say so once. If none works, stop and ask the user to install Git for Windows; do not run the command in PowerShell.
- **Never use PowerShell-only tokens:** `Get-ChildItem`, `Get-Content`, `Set-Content`, `Add-Content`, `Out-File`, `Remove-Item`, `Test-Path`, `New-Item`, `Copy-Item`, `Move-Item`, `Select-String`, `Select-Object`, `Where-Object`, `ForEach-Object`, `Write-Output`, `Write-Host`, `Start-Process`, `Invoke-*`, `$env:`, `$LASTEXITCODE`, `if ($?)`, backticks as escapes, and `.ps1` scripts. Use `ls`, `cat`, `printf`, `grep`, `sed`, `awk`, `find`, `test`, `rm`, `$?`, and `&&`/`||` instead.
- **Use Node.js scripts or the agent's file tools for edits.** PowerShell traps: backticks are escapes that corrupt Markdown/TypeScript, `Set-Content` defaults to ANSI (destroying UTF-8), and `&&` is unsupported in Windows PowerShell 5.1.
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
2. Run `.github/enable-branch-protection.sh` with Git Bash. The `.ps1` exists for humans who prefer PowerShell; agents must not run it.
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
