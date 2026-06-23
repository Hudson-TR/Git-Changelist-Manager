# Changelog

All notable changes to the Git Changelist Manager extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.2.0] - 2026-06-23

Completes the **Version 1.0.0 — Enhanced UI** roadmap and adds an automated
test suite.

### Added

- **Inline diff preview**: hover any file in a changelist to preview its changes
  without opening it (syntax-highlighted diff; synthetic diff for untracked
  files; `Binary file (no preview)` for binaries).
- **Open changes on click**: clicking a file opens VS Code's native comparison
  (diff) view — HEAD vs working tree for modified/renamed files, the committed
  version for deletions, and the file directly for untracked/added files.
- **Search and filter**: filter files across all changelists from the toolbar or
  with `Ctrl+Alt+F` / `Cmd+Alt+F`. Case-insensitive, multi-term AND matching on
  file name or path, with a clear-filter action and a results count message.
- **Status bar integration**: shows the active changelist (bracketed, tinted with
  the list color) and switches lists on click. Previously documented and
  configurable but never implemented.
- **Automated test suite**: unit tests (Mocha) for pure helpers, diff-preview and
  filter logic, plus integration tests via `@vscode/test-electron` (extension
  smoke + `ChangeListManager`). New scripts: `test:unit`, `test:integration`, `test`.
- **Settings**: `ui.inlineDiffPreview.enabled`, `ui.inlineDiffPreview.maxLines`
  (5–50), and `ui.filter.hideEmptyLists`.
- **Commands**: `gitChangelistManager.filterChangelists` and
  `gitChangelistManager.clearFilterChangelists`.

### Changed

- Documented the previously-shipped **changelist colors** and **status count
  badges** (`M`/`A`/`D`/`R`/`U`) across the README and feature docs.
- Roadmap: **Version 1.0.0 — Enhanced UI** marked complete (shipped in 1.2.0).
- `DEVELOPMENT.md` testing section rewritten from "Future" to real instructions.

### Fixed

- Status bar was documented and configured (`showStatusBar`) but never wired up;
  it is now implemented and disposed with the extension.
- Inline hover preview now renders the diff: a pre-set file tooltip was
  suppressing the lazy `resolveTreeItem` call that builds the preview.

---

## [1.1.0] - 2026-06-23

### Added

- `NOTICE` file with AGPL copyright attribution.
- `tsconfig.json` `types: ["node"]` for TypeScript 6 compatibility.

### Changed

- Command palette titles use **Changelist** naming (e.g. `Create Changelist`, `Stage Changelist`).
- SCM view label updated from **Change Lists** to **Changelists**.
- View ID updated to `gitChangelistManager.changelists`.
- User-facing messages and commit guard dialogs aligned with new terminology.
- Documentation focused on this project; legal attribution consolidated in `NOTICE` and `LICENSE`.
- Slimmer VSIX packaging (`docs/` and `pnpm-lock.yaml` excluded via `.vscodeignore`).
- `vscode:prepublish` runs `tsc` directly for cleaner packaging.
- Minimum VS Code engine raised to **1.125.0**.

### Changed (Dependencies)

- `typescript` 5.9 → **6.0**
- `@types/node` 20 → **26**
- `@types/vscode` 1.74 → **1.125**
- `@vscode/vsce` 2.x → **3.9**

### Removed

- Runtime dependency on `uuid` (uses `crypto.randomUUID()`).
- Unused `simple-git` dependency.

### Breaking Changes

- Extension ID is now `Hudson-TR.git-changelist-manager`.
- Settings namespace changed from `gitChangeLists.*` to `gitChangelistManager.*` — update `settings.json` if migrating from the upstream extension.
- Command IDs changed from `gitChangeLists.*` to `gitChangelistManager.*`.
- Requires VS Code / Cursor **1.125.0** or newer.

---

## [1.0.1] - 2026-06-23

### Changed

- Rebranded as **Git Changelist Manager** under publisher `Hudson-TR`.
- Replaced `uuid` with Node.js `crypto.randomUUID()` for VSIX packaging.
- Standardized package manager on pnpm.
- Renamed commands, settings, and view to `gitChangelistManager.*`.

---

## [1.0.0] - 2026-02-01

### Added
- Initial release of Git Changelist Manager.
- Custom Named Change Lists.
- Integrated Staging Workflow.
- Commit Guard (prevent mixed commits).
- List and Tree View modes.
- Status Bar integration.
- Patch Management (Create/Apply).
- Auto-assignment of changes to active list.

#### Core Features
- **Change List Management**
  - Create custom named change lists to organize uncommitted changes
  - Rename change lists with uniqueness validation
  - Delete change lists with confirmation for non-empty lists
  - Default change list that cannot be deleted (captures unassigned changes)

- **Active List System**
  - Set any change list as "active" to receive new changes automatically
  - Only one list can be active at a time (singleton enforcement)
  - Active status persists across VS Code restarts
  - Active list displayed in status bar with quick-switch dropdown

- **File Organization**
  - Drag-and-drop files between change lists with visual feedback
  - Move files via context menu "Move to Changelist"
  - Multi-select support for moving multiple files at once
  - Auto-assignment of externally staged files to active list

- **View Modes**
  - **List Mode**: Flat view of all files (optimized for quick scanning)
  - **Tree Mode**: Hierarchical view preserving project structure
  - Toggle between modes with persistence of view state
  - Expansion state remembered per-mode across sessions

- **Git Integration**
  - Real-time synchronization with Git state changes
  - Detection of external staging operations (command line, file explorer)
  - Post-commit cleanup (automatically removes committed files from lists)
  - File status mapping (Modified, Added, Deleted, Renamed, etc.)
  - Compatible with VS Code's built-in Git extension

- **Patch Management**
  - Create patches from change lists (Copy to Clipboard / Save to File)
  - Apply patches to specific change lists (From Clipboard / From File)
  - Support for untracked files in patches
  - Robust handling of non-ASCII filenames and quoted paths

- **Commit Guard Service**
  - Validates staged files before commit
  - Warns when files from multiple change lists are staged
  - Options: Unstage extra files, Commit anyway, or Cancel
  - Guarded commit command with keybinding (`Ctrl+Enter`/`Cmd+Enter`)
  - Configuration to intercept native commit command

- **User Interface**
  - Tree view in SCM panel showing change lists and files
  - Status bar integration with active list display
  - Context menus for list operations (rename, delete, stage, set active)
  - Context menus for file operations (move, open diff)
  - Toolbar buttons (create list, toggle view, refresh)
  - Command palette integration for all operations

- **Configuration System**
  - 8 configurable settings via VS Code settings UI
  - Settings for view mode, status bar, confirmations, auto-activation
  - Commit guard settings (enabled, intercept commit)
  - Auto-assign staged files setting
  - Debug logging control

- **Debug Logging**
  - Configurable logging system with multiple levels (DEBUG, INFO, WARN, ERROR, EVENT)
  - Output to "Git Changelist Manager" channel in Output panel
  - Optional verbose DEBUG logging for troubleshooting
  - Async logging with no file I/O overhead
  - See [DEBUGGING.md](DEBUGGING.md) for details

#### Developer Features
- TypeScript codebase with strict type checking
- Event-driven architecture with proper disposables
- State persistence using workspace storage
- Schema versioning for future migrations
- Comprehensive logging for debugging
- Well-organized project structure (`/services`, `/providers`, `/commands`, `/types`, `/utils`)

### Technical Details

#### Architecture
- **Services**: `ChangeListManager`, `GitService`, `CommitGuardService`, `ConfigService`
- **Providers**: `TreeDataProvider`, `TreeDragAndDropController`
- **Commands**: 11 commands registered with proper context awareness
- **Types**: Strongly typed interfaces for `ChangeList`, `TrackedChange`, `TreeNode` variants
- **State Management**: JSON serialization with atomic writes to `workspaceState`

#### Dependencies
- Runtime: none (Node.js built-ins)
- Dev: TypeScript 6, `@types/node` 26, `@types/vscode` 1.125, VSCE 3

#### Compatibility
- **Minimum VS Code**: 1.125.0
- **Tested On**: VS Code, Cursor, Kiro, Windsurf, Trae, VSCodium, Google Antigravity
- **Git Extension**: Requires `vscode.git` extension (built-in)
- **Multi-Root Workspaces**: Prepared (isolated state per workspace folder)

### Known Limitations

- **Commit Guard**: Cannot intercept native commit button click (only keybindings work)
- **Untracked Files**: Surfaced in a virtual "Unversioned Files" list

> **Note:** Change List Colors, Change Count Badges, Inline Diff Preview, Search
> and Filter, and Status Bar Integration listed as limitations/planned here were
> completed in **v1.2.0** — see the [1.2.0](#120---2026-06-23) entry above.

### Documentation

- Comprehensive README with installation, features, and usage
- Installation guide for all supported editors
- User guide with workflows and best practices
- Complete feature documentation
- Configuration reference
- Debugging guide
- FAQ for common questions
- Contributing guide for developers
- Development setup guide
- Technical architecture documentation (OVERVIEW.md, BLUEPRINT.md)

### Notes

- This is an early release (0.0.1) with core functionality complete
- Active development continues - see [Roadmap](../README.md#roadmap)
- Feedback and contributions welcome on [GitHub](https://github.com/Hudson-TR/Git-Changelist-Manager)

---

## Version History

### Versioning Strategy

Git Changelist Manager follows [Semantic Versioning](https://semver.org/):
- **Major (1.0.0)**: Breaking changes, major rewrites
- **Minor (0.x.0)**: New features, backwards-compatible
- **Patch (0.0.x)**: Bug fixes, documentation, minor improvements

### Release Cadence

- **Patch releases**: As needed for critical bugs
- **Minor releases**: Monthly to quarterly with new features
- **Major releases**: When significant breaking changes are necessary

---

## Upgrade Guide

### From Future Versions

No upgrades available yet. This is the initial release.

When upgrading in the future:
1. Check this CHANGELOG for breaking changes
2. Review new configuration options
3. Update your `settings.json` if needed
4. Test with your workflow before relying on new features

---

## Contributing to the Changelog

When contributing to Git Changelist Manager, please update this changelog as part of your PR:

1. Add your changes under the `[Unreleased]` section
2. Categorize changes as: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
3. Use clear, user-facing language (not technical jargon)
4. Link to relevant issues or PRs

Example:
```markdown
## [Unreleased]

### Added
- Support for change list colors (#42)

### Fixed
- Crash when renaming active list (#38)
```

Maintainers will move unreleased changes to versioned sections during releases.

---

## Links

- [GitHub Repository](https://github.com/Hudson-TR/Git-Changelist-Manager)
- [Issue Tracker](https://github.com/Hudson-TR/Git-Changelist-Manager/issues)
- [Releases](https://github.com/Hudson-TR/Git-Changelist-Manager/releases)
- [Documentation](../README.md)

[Unreleased]: https://github.com/Hudson-TR/Git-Changelist-Manager/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Hudson-TR/Git-Changelist-Manager/releases/tag/v1.1.0
[1.0.1]: https://github.com/Hudson-TR/Git-Changelist-Manager/releases/tag/v1.0.1
[1.0.0]: https://github.com/Hudson-TR/Git-Changelist-Manager/releases/tag/v1.0.0
