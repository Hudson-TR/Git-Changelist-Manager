# AGENTS.md

Project context for AI agents working on **Git Changelist Manager**, a VS Code extension that brings JetBrains-style changelists to VS Code and compatible editors (Cursor, Kiro, Windsurf, etc.).

This file describes how the code is actually built and structured. Where it disagrees with `docs/`, trust this file and `package.json` (see "Accuracy notes" at the end).

---

## TL;DR for agents

- **Language/runtime:** TypeScript (strict), compiled with `tsc` to CommonJS targeting ES2022. Runs in the VS Code extension host (Node).
- **Package manager:** **pnpm only** (pinned `pnpm@10.33.3`). Do not use `npm`/`yarn`. `package-lock.json` is gitignored on purpose.
- **No runtime dependencies.** There is no `dependencies` field. IDs come from `crypto.randomUUID()`, Git work is done via the bundled `vscode.git` API plus the system `git` CLI (`child_process`). Don't add libraries like `uuid`/`simple-git`.
- **Build:** `pnpm run compile` (output in `out/`). **Run/debug:** press `F5`.
- **Tests:** unit (Mocha) + integration (`@vscode/test-electron`), run with `pnpm run test` (or `test:unit` / `test:integration`). **Lint:** script exists but is currently non-functional (no ESLint installed/configured).
- **License:** AGPL-3.0-only.

---

## Build, run & verify

All commands run from the repo root.

| Task | Command | Notes |
|------|---------|-------|
| Install deps | `pnpm install` | Required: pnpm. |
| Compile | `pnpm run compile` | `tsc -p ./` → emits to `out/`. Use this to verify a change builds. |
| Watch build | `pnpm run watch` | `tsc -watch`. This is the default build task and the `F5` pre-launch task. |
| Package VSIX | `pnpm run package` | `compile` + `vsce package --no-dependencies`. `@vscode/vsce` is a dev dep, so this works. |
| Test | `pnpm run test` | `compile` + unit (Mocha) + integration (`@vscode/test-electron`). Also `test:unit` / `test:integration`. |
| Publish | `pnpm run publish` | Package once + publish to VS Code Marketplace and Open VSX (`publish:vsce` / `publish:ovsx` for one target). Requires `VSCE_PAT` or `vsce login`, and `OVSX_PAT` — don't run without explicit instruction. |
| Lint | `pnpm run lint` | **Currently broken:** runs `eslint src --ext ts`, but ESLint is not in `devDependencies` and no config file exists. Don't rely on it. |

**After any code change, run `pnpm run compile` and confirm it succeeds** before considering the work done.

### Debugging in the editor (`.vscode/launch.json`)
- **Run Extension** — launches an Extension Development Host with this extension loaded (pre-launch task = watch build).
- **Extension Tests** — points at `out/test/suite/index`, but no tests are implemented, so it currently has nothing to run.

---

## What the extension does (mental model)

A **changelist** is a named container that groups uncommitted files. The extension layers this on top of VS Code's native Git without replacing it:

- Each modified/added/etc. file is mapped to exactly one changelist. Files with no explicit mapping fall back to the **Default** list (always exists, can't be deleted).
- Exactly **one list is active**; externally-staged new files can auto-assign to it.
- A virtual, read-only **"Unversioned Files"** list surfaces untracked files (injected at read time, not persisted).
- The UI is a `TreeView` under the SCM (Source Control) container, in either flat **list** or hierarchical **tree** mode.
- A **commit guard** warns when staged files span multiple lists.

Activation: `activationEvents` is empty; the extension activates when a Git repo is open and the **Changelists** view (`gitChangelistManager.changelists`, `when: gitOpenRepositoryCount > 0`) appears. It declares `extensionDependencies: ["vscode.git"]`.

---

## Architecture & module map

Entry point `src/extension.ts` → `activate()` constructs services, the tree provider, the drag-drop controller, registers commands, and wires everything together with event subscriptions. All disposables go into `context.subscriptions`.

```
src/
├─ extension.ts            Entry point: activate()/deactivate(); wires services + events
├─ commands/
│  ├─ index.ts             registerCommands(...) — all command handlers live here
│  └─ quickPick.ts         small quick-pick helper
├─ services/              Business logic (each implements vscode.Disposable)
│  ├─ changeListManager.ts  Core state: lists + fileMapping; CRUD; active/default rules
│  ├─ gitService.ts         vscode.git API + direct `git` CLI; emits state/stage/commit events
│  ├─ configService.ts      Typed getters over workspace config; onDidChangeConfiguration
│  ├─ commitGuardService.ts Validates staged files span ≤1 list; modal guard dialog
│  ├─ patchService.ts       Generate / apply / save patches per list
│  ├─ diffPreviewService.ts Diff preview support
│  └─ index.ts              barrel
├─ providers/
│  ├─ treeDataProvider.ts   TreeDataProvider<AnyTreeNode>; list/tree modes; per-refresh cache
│  ├─ dragDropController.ts  Drag-and-drop between lists (DRAG_MIME_TYPE)
│  └─ index.ts
├─ integrations/
│  ├─ statusBarIntegration.ts  Status-bar module — active-list indicator, wired in activate()
│  └─ index.ts
├─ utils/
│  ├─ constants.ts         IDs: COMMANDS, CONFIG, STORAGE_KEYS, CONTEXT_VALUES, VIEW_ID, etc.
│  ├─ helpers.ts           generateId, now, path utils, debounce, sortChangeLists, buildPathTrie
│  ├─ logger.ts            singleton `logger` (output channel), gated by debug.enableLogging
│  ├─ diffPreview.ts / diffPreviewCore.ts   diff preview helpers
└─ types/
   ├─ changeList.ts        Data model: ChangeList, TrackedChange, GitFileStatus, tree nodes, events
   ├─ git.d.ts             Type definitions for the vscode.git extension API
   └─ index.ts             barrel
```

### Event flow (who reacts to what)
- `GitService.onDidChangeState` → tree refresh.
- `GitService.onDidStageFiles` → auto-assign new staged files to the active list (if enabled and file is currently in Default).
- `GitService.onDidCommit` → `ChangeListManager.removeFileMappings(...)` (post-commit cleanup).
- `ChangeListManager.onDidChange` → tree refresh.
- `ConfigService.onDidChangeConfiguration` → re-read debug flag + tree refresh.

`GitService` detects staging/commits by diffing `repository.state` (comparing index changes and `HEAD` commit across change events), debounced by `REFRESH_DEBOUNCE_MS`.

---

## Data model & persistence

```ts
interface ChangeList {
  id: string;            // crypto.randomUUID()
  name: string;
  description?: string;
  color?: string;        // VS Code theme color id, e.g. "charts.red"
  isActive: boolean;     // exactly one true at a time
  isDefault: boolean;    // the Default list; cannot be deleted
  createdAt: number; updatedAt: number;
  isReadOnly?: boolean;  // true for the virtual "Unversioned Files" list
}

interface ChangeListState {
  version: number;                    // STATE_SCHEMA_VERSION (currently 1)
  lists: ChangeList[];
  fileMapping: Record<string, string>; // absolute file path -> changelist id
}
```

- Persisted via `context.workspaceState` (a `vscode.Memento`) under `STORAGE_KEYS.CHANGE_LIST_STATE`. State is **per workspace**, not global.
- Files absent from `fileMapping` resolve to the Default list.
- The "Unversioned Files" list (`UNVERSIONED_LIST_ID`) is synthesized in `getLists()` and is not stored.
- View mode and tree expansion state persist under their own `STORAGE_KEYS`.
- `migrateState()` is the hook for schema migrations (only v1 exists today).

---

## Conventions (match these)

- **TypeScript strict mode.** 2-space indent, single quotes, semicolons, trailing commas. JSDoc comments on classes and public methods.
- **Never hardcode identifiers.** Use `COMMANDS.*`, `CONFIG.*`, `STORAGE_KEYS.*`, `CONTEXT_VALUES.*`, `VIEW_ID` from `src/utils/constants.ts`. Command IDs are also declared in `package.json > contributes.commands` — keep both in sync.
- **Disposables:** services that hold listeners implement `vscode.Disposable` and are pushed to `context.subscriptions`.
- **Events:** use `vscode.EventEmitter` with `_onDidX` private + `onDidX` public, following the existing pattern.
- **Logging:** use the `logger` singleton (`logger.debug/info/warn/error/event`). Verbose logs are gated by the `debug.enableLogging` setting — don't use raw `console.log`.
- **Adding a command:** declare it in `package.json` (`commands`, and `menus`/`keybindings`/`commandPalette` as needed), add its ID to `COMMANDS` in `constants.ts`, then register the handler in `src/commands/index.ts`.
- **Menu visibility** is driven by tree-item `contextValue`s (`changeListDefault`, `changeListActive`, `changeListReadOnly`, `changeListFile`, `changeListDirectory`) referenced in `package.json` `when` clauses.

---

## Git integration gotchas

- **Staging/unstaging/patch generation use the system `git` CLI directly** (`cp.execFile('git', ...)` in `GitService`) to work around `vscode.git` API limitations, then call `repository.status()` to refresh. The `vscode.git` API is used for state, events, commit, diff, and the SCM input box.
- `moveFiles(...)` to a regular list **also stages** those files; moving to "Unversioned Files" **unstages** them (`git reset HEAD`).
- `createPatch(...)` temporarily `git add -N`s untracked files so they appear in the diff, then reverts them in a `finally` block.
- **Commit guard** cannot intercept the native commit *button* (VS Code API limitation). It works via the `gitChangelistManager.guardedCommit` command, bound to `Ctrl/Cmd+Enter` in the SCM input only when `commitGuard.interceptCommit` is enabled. It wraps `git.commit`.
- **Windows-first dev environment.** Paths are normalized to forward slashes (`helpers.normalizePath`) and the git CLI is given repo-relative paths with `/` separators. Preserve this when touching path logic.
- Multi-root: `GitService` currently uses `repositories[0]` only (single-repo). Multi-root is not fully implemented despite README mentions.

---

## Settings (declared in `package.json`)

All under the `gitChangelistManager.` prefix; read them through `ConfigService`, never `vscode.workspace.getConfiguration` directly in feature code.

`defaultViewMode` ("list"|"tree"), `showStatusBar`, `confirmDeleteNonEmpty`, `autoActivateNew`, `commitGuard.enabled`, `commitGuard.interceptCommit`, `autoAssignStagedFiles`, `debug.enableLogging`, `ui.inlineDiffPreview.enabled`, `ui.inlineDiffPreview.maxLines`, `ui.filter.hideEmptyLists`.

---

## Testing status

- **Implemented (v1.2.0).** Unit tests (Mocha) live in `src/test/unit/` and cover pure logic (helpers, diff-preview, filter). Integration tests live in `src/test/suite/` and run in a real VS Code host via `@vscode/test-electron` (`src/test/runTest.ts` → `suite/index.ts`).
- Scripts: `pnpm run test:unit`, `pnpm run test:integration`, and `pnpm run test` (compile + both). Unit tests stub the `vscode` module via `src/test/unit/setup.ts` + `vscode-mock.ts`; config is in `.mocharc.json`.
- Tests compile to `out/test/` (excluded from the VSIX via `.vscodeignore`). `src/test/fixtures/sample-repo/` is the workspace opened by the integration host. The `launch.json` "Extension Tests" config points at `out/test/suite/index`.

---

## Accuracy notes (docs vs. code) — important

`docs/` is helpful for product/feature intent but is partially stale relative to the source. When in doubt, trust `package.json` and the code.

- **`docs/DEVELOPMENT.md` was updated for 1.2.0** with real testing instructions. Older claims it once made (npm, runtime deps `simple-git` + `uuid`, MIT license, an `.eslintrc.json`, VS Code 1.103) are **wrong** — **Reality:** pnpm, zero runtime deps (`crypto.randomUUID()` + git CLI + `vscode.git`), **AGPL-3.0-only**, **no ESLint config**, and `engines.vscode = ^1.125.0`.
- **Status bar feature is implemented and wired (v1.2.0).** `src/integrations/statusBarIntegration.ts` is instantiated in `activate()` and disposed via `context.subscriptions`; it reads `showStatusBar` and reacts to changelist/git/config/workspace events.
- **Version:** the manifest (`package.json`) is the source of truth (currently `1.2.0`). Built `.vsix` artifacts in the repo root match the manifest.
- README/roadmap version numbering is aspirational and internally inconsistent — don't treat it as ground truth for what's implemented.

---

## Safety / housekeeping

- Don't commit unless explicitly asked. If asked, stage specific files (avoid `git add .`), and never commit the `*.vsix` build artifacts or `out/` (the latter is gitignored).
- `publish`/`vsce publish` and any marketplace action require explicit confirmation.
- Keep changes scoped; prefer extending existing services/patterns over introducing new dependencies (the project is intentionally dependency-free at runtime).
