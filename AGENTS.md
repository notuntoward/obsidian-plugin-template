# Agent Instructions for this Obsidian plugin template

## Task scope and validation

Cache exact instructions per checkout/task; read guides only for changed areas.
Restore only missing/changed sections after compaction.
- Docs/instructions-only: text/link/format checks, not application tests/builds,
  browsers, installs or consumer sweeps. This qualifies completion gates below.
- Publication-only: reuse green checks/artifacts for unchanged code, dependencies,
  build inputs AND linked commons; validate unchecked pending source once.
- Source changes: targeted iteration tests, required final checks once; reuse
  composite steps and verify their bundle rather than rebundling.
Keep fresh Git branch/identity/message/hook checks and final remote-tip verification.

## Build verification rule

For changed source/build inputs, use the package's fast bundler only during an
actual runtime iteration. At completion, run its production build and required
unit tests once; skip steps already included in the composite build. Record the
build start and verify root main.js is newer and contains a unique changed
literal via the repository verifier or a line-length-safe Node check, not grep
for minified names. Reuse unchanged evidence for docs/publication-only follow-ups.
Never search for a vault, change its link or build/copy from another checkout.

## Tooling

- Fast bundle: `npm run bundle` (<1s).
- Verify artifact: `npm run verify -- "<fingerprint>"` (<100ms).
- Lint: `npm run lint` (ESLint with `eslint-plugin-obsidianmd` rules, zero warnings).
- Type-check: `npm run build` (runs lint, `tsc --noEmit`, and bundle).
- Unit tests: `npm test` or `npm run test:run` (Vitest). `obsidian` resolves to `tests/__mocks__/obsidian.ts` which re-exports `commons/testing/obsidian-mock`.
- Browser tests: `npm run test:browser` (Playwright, requires `npx playwright install chromium`).

## Shared library: commons

Use commons for workspace/window/tab/focus, per-window timers/clipboard, modal,
search, geometry, page-color and line-flash helpers; never duplicate its
undocumented Obsidian adapters in plugin code. For an owned-area change, consult
the installed module exports and relevant commons guide sections. Change commons
with a regression test if needed, never a local copy. Docs/publication-only work
does not require opening the library or rebuilding its consumers.
Local adoption uses file:../obsidian-commons; obey the library's existing
commons-adoption branch and explicit-ref/tag-disabled publication rules.

<!-- BEGIN SUITE IMPACT -->
## Suite impact

Before and after source or contract changes, run
`node ../obsidian-commons/scripts/inventory.mjs impact`. Read only the listed required contract peers and
same-surface symmetry candidates; do not scan every sibling repository. Run
their configured checks only when the report or changed contract requires them.

Run `node ../obsidian-commons/scripts/inventory.mjs release-check` before source release. The report
distinguishes a valid bundled runtime artifact from reproducible source
dependencies. If the project declares a shared-package link, pin an immutable
tag/commit before release and pass the check again.

Run `node ../obsidian-commons/scripts/inventory.mjs community-review <project|all>` for the Obsidian
community-rule lint gate. This command runs only each selected repository's
local `npm run lint:community-review`; a consumer check/build must never start a
suite traversal. Standalone browser userscripts are outside the Obsidian
runtime profile and remain under the repository's normal lint rules.

For manual repository maintenance, run `node ../obsidian-commons/scripts/inventory.mjs bot-prs
<project...>` and `node ../obsidian-commons/scripts/inventory.mjs maintain <project...>`. They default to
dry-run; add `--apply` only to approve/update eligible bot PRs and synchronized
rule dependencies. `maintain` implicitly adds commons for any Obsidian review
target; positional `all` selects the entire inventory.
<!-- END SUITE IMPACT -->
Before and after source or contract changes, run
`node ../obsidian-commons/scripts/inventory.mjs impact`. Read only the listed
required contract peers and same-surface symmetry candidates; do not scan every
sibling repository. Run their configured checks only when the report or changed
contract requires them.

`file:../obsidian-commons` is valid local build input because esbuild bundles
imported commons source into `main.js`. Before source release, pin an immutable
commons tag/commit and pass
`node ../obsidian-commons/scripts/inventory.mjs release-check`.

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

Never search for the vault and never mention a vault path. When runtime inputs
change, verify the production build only inside this repository: check `main.js`
against its build start and a unique literal, and state its absolute path.
Docs/publication-only work reuses unchanged verification. Never repoint or delete the vault
link, and never change it to expose a worktree.

## Shell and Git safety

Use the global Bash-only shell policy; detect once and reuse the working shell.
Without personal rules, use Git Bash on Windows (not bare bash/PowerShell), native
file tools/Node for edits, existing Git identities and LF policy. Never bypass
hooks/signing, force-push, rewrite history or add AI attribution. Inspect the
literal subject/overview/bullets (one physical line each); use a quoted Bash
heredoc and git commit -F, then remove the temporary message file.
Use an imperative subject <=72 characters, blank line, overview and distinct
material-change bullets separated from the overview by one blank line.

## Repository setup for new plugins seeded from this template

When setting up or configuring a newly created plugin repository (the branch-protection step is for repositories with a reviewer; skip it while working solo with plain git):
1. Verify GitHub CLI authentication (`gh auth status`).
2. Run `.github/enable-branch-protection.sh` with Git Bash. The `.ps1` exists for humans who prefer PowerShell; agents must not run it.
   This script:
   - Configures branch protection on `main` (requires 'ESLint and build', 1 approval, blocks force-pushes).
   - Enables native repository auto-merge (`allow_auto_merge`).
   - Grants GitHub Actions permission to approve PRs (`can_approve_pull_request_reviews: true`) so Dependabot patch and minor updates auto-merge.

## Native Obsidian APIs

Prefer fileManager.processFrontMatter, metadataCache.getFileCache (remove
frontmatter.position before copying), vault.cachedRead/process, native createEl
and SuggestModal/FuzzySuggestModal over custom YAML/I/O/DOM/pickers. Use the
installed obsidian.d.ts for new/uncertain API signatures, not a full rescan for
already verified calls. Keep esbuild/sample-plugin structure, theme variables and
unload cleanup. Bootstrap official scaffolding/types only in a confirmed blank repo.
