# Git Changelist Manager Configuration

Complete reference for all configuration settings in Git Changelist Manager v1.0.0.

---

## Table of Contents

- [Configuration Overview](#configuration-overview)
- [All Settings](#all-settings)
- [Setting Details](#setting-details)
- [Configuration Examples](#configuration-examples)
- [Recommended Configurations](#recommended-configurations)
- [Workspace vs Global Settings](#workspace-vs-global-settings)
- [Troubleshooting Configuration](#troubleshooting-configuration)

---

## Configuration Overview

Git Changelist Manager can be configured through VS Code's settings UI or by editing `settings.json` directly.

### Access Settings

#### Via Settings UI

1. Open Settings: `Ctrl+,` (or `Cmd+,` on Mac)
2. Search for "Git Changelist Manager"
3. Modify settings with checkboxes and dropdowns

#### Via settings.json

1. Open Command Palette: `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Run: `Preferences: Open Settings (JSON)`
3. Add Git Changelist Manager settings under the root object

### Setting Namespace

All Git Changelist Manager settings are prefixed with `gitChangelistManager.`:

```json
{
  "gitChangelistManager.defaultViewMode": "list",
  "gitChangelistManager.showStatusBar": true
}
```

---

## All Settings

Quick reference table of all available settings:

| Setting | Type | Default | Scope | Description |
|---------|------|---------|-------|-------------|
| `gitChangelistManager.defaultViewMode` | `"list"` \| `"tree"` | `"list"` | Workspace | Default view mode for file display |
| `gitChangelistManager.showStatusBar` | `boolean` | `true` | Global | Show active list in status bar |
| `gitChangelistManager.confirmDeleteNonEmpty` | `boolean` | `true` | Global | Confirm before deleting non-empty lists |
| `gitChangelistManager.autoActivateNew` | `boolean` | `true` | Global | Auto-activate newly created lists |
| `gitChangelistManager.commitGuard.enabled` | `boolean` | `true` | Global | Warn when staging mixed change lists |
| `gitChangelistManager.commitGuard.interceptCommit` | `boolean` | `false` | Global | Intercept native commit command |
| `gitChangelistManager.autoAssignStagedFiles` | `boolean` | `true` | Global | Auto-assign externally staged files |
| `gitChangelistManager.debug.enableLogging` | `boolean` | `true` | Global | Enable verbose debug logging |
| `gitChangelistManager.ui.inlineDiffPreview.enabled` | `boolean` | `true` | Global | Show inline diff preview on file hover |
| `gitChangelistManager.ui.inlineDiffPreview.maxLines` | `number` | `20` | Global | Max diff lines in the hover preview (5–50) |
| `gitChangelistManager.ui.filter.hideEmptyLists` | `boolean` | `true` | Global | Hide lists with no matches while filtering |

---

## Setting Details

### View and Display

#### `gitChangelistManager.defaultViewMode`

**Type:** `"list"` | `"tree"`
**Default:** `"list"`
**Scope:** Workspace
**Restart Required:** No

**Description:**
Determines the initial view mode when opening a workspace or creating a change list.

**Values:**
- `"list"`: Flat view showing all files directly under each change list
- `"tree"`: Hierarchical view preserving project directory structure

**Behavior:**
- Only affects the *default* mode on first view
- Users can toggle between modes anytime
- View mode choice is persisted per workspace
- Each workspace can have a different default

**Example:**

```json
{
  "gitChangelistManager.defaultViewMode": "tree"
}
```

**When to Use:**
- Use `"list"` for small projects with few directories
- Use `"tree"` for large projects with deep folder structures
- Set per-workspace based on project complexity

---

#### `gitChangelistManager.showStatusBar`

**Type:** `boolean`
**Default:** `true`
**Scope:** Global
**Restart Required:** No

**Description:**
Controls visibility of the active change list indicator in the status bar.

**When `true`:**
- Status bar shows the active change list name (e.g., `[Feature A]`)
- Click to open quick-pick for switching lists
- Tooltip shows full name if truncated

**When `false`:**
- Status bar item is hidden
- Active list can still be changed via context menu or keybinding

**Example:**

```json
{
  "gitChangelistManager.showStatusBar": false
}
```

**When to Disable:**
- Minimal status bar preference
- Workspace with only one change list (Default)
- Using external monitoring tools

---

### Confirmations and Safety

#### `gitChangelistManager.confirmDeleteNonEmpty`

**Type:** `boolean`
**Default:** `true`
**Scope:** Global
**Restart Required:** No

**Description:**
Asks for confirmation before deleting a change list that contains files.

**When `true`:**
- Deleting a non-empty list shows a confirmation dialog
- Dialog includes file count and options to proceed or cancel
- Prevents accidental deletion of organized work

**When `false`:**
- Lists are deleted immediately without confirmation
- Files are reassigned to Default list
- Faster workflow for experienced users

**Example:**

```json
{
  "gitChangelistManager.confirmDeleteNonEmpty": false
}
```

**When to Disable:**
- You're confident in your delete operations
- You frequently reorganize and delete lists
- You want a faster workflow

**Note:** Empty lists never prompt for confirmation, regardless of this setting.

---

### Automation

#### `gitChangelistManager.autoActivateNew`

**Type:** `boolean`
**Default:** `true`
**Scope:** Global
**Restart Required:** No

**Description:**
Automatically sets newly created change lists as active.

**When `true`:**
- Creating a new list immediately sets it as active
- New changes automatically go to the new list
- Streamlines workflow when starting new tasks

**When `false`:**
- Newly created lists are inactive by default
- User must manually set the list as active
- Default list remains active

**Example:**

```json
{
  "gitChangelistManager.autoActivateNew": false
}
```

**When to Disable:**
- You create lists for future use (not immediate work)
- You prefer explicit active list control
- You frequently create "parking lot" lists

**Workflow Comparison:**

**With `autoActivateNew: true`:**
1. Create "Feature X" list
2. It becomes active automatically
3. Start coding, files go to "Feature X"

**With `autoActivateNew: false`:**
1. Create "Feature X" list
2. It remains inactive
3. Manually set it as active when ready
4. Start coding, files go to "Feature X"

---

#### `gitChangelistManager.autoAssignStagedFiles`

**Type:** `boolean`
**Default:** `true`
**Scope:** Global
**Restart Required:** No

**Description:**
Automatically assigns externally staged files to the active change list.

**When `true`:**
- Files staged via command line, file explorer, or other extensions are assigned to the active list
- Keeps change lists synchronized with Git operations
- Maintains organization consistency

**When `false`:**
- Externally staged files are not assigned to any list
- They appear in the Default list
- Manual reassignment required

**Example:**

```json
{
  "gitChangelistManager.autoAssignStagedFiles": false
}
```

**External Staging Examples:**
- Command line: `git add src/app.ts`
- File explorer: Right-click → Stage Changes
- Another extension's staging command
- Bulk stage operations

**When to Disable:**
- You rarely use external Git tools
- You prefer manual control over all assignments
- You have complex staging workflows

---

### Commit Guard

#### `gitChangelistManager.commitGuard.enabled`

**Type:** `boolean`
**Default:** `true`
**Scope:** Global
**Restart Required:** No

**Description:**
Enables the commit guard feature that warns when committing files from multiple change lists.

**When `true`:**
- Validates staged files before commit (via guarded commit command or keybinding)
- Shows warning dialog if files are from multiple lists
- Options: Unstage extra files, Commit anyway, or Cancel

**When `false`:**
- Commit guard is completely bypassed
- All commits proceed without validation
- No warnings about mixed change lists

**Example:**

```json
{
  "gitChangelistManager.commitGuard.enabled": false
}
```

**When to Disable:**
- You intentionally commit mixed changes frequently
- You find the warnings disruptive
- You have other validation mechanisms

**Note:** Even when enabled, the guard only activates when using:
- `Git Changelist Manager: Commit (with Guard)` command
- `Ctrl+Enter` / `Cmd+Enter` keybinding (if `interceptCommit` is enabled)

---

#### `gitChangelistManager.commitGuard.interceptCommit`

**Type:** `boolean`
**Default:** `false`
**Scope:** Global
**Restart Required:** **Yes** (VS Code restart required)

**Description:**
Intercepts the native Git commit command (`Ctrl+Enter` / `Cmd+Enter`) to apply the commit guard.

**When `true`:**
- `Ctrl+Enter` / `Cmd+Enter` in the SCM input box triggers the guard
- Commit validation runs automatically before every keybinding commit
- Seamless integration with normal workflow

**When `false`:**
- `Ctrl+Enter` / `Cmd+Enter` uses native Git commit (no guard)
- Guard only applies when using `Git Changelist Manager: Commit (with Guard)` command
- Must explicitly choose guarded commit

**Example:**

```json
{
  "gitChangelistManager.commitGuard.interceptCommit": true
}
```

**Important Notes:**
- **Requires restart**: Changes take effect only after reloading VS Code
- **Keybinding only**: Does NOT intercept the commit button (checkmark icon)
- **Depends on `enabled`**: If `commitGuard.enabled` is `false`, interception is inactive

**When to Enable:**
- You always want commit validation
- You primarily use `Ctrl+Enter` to commit (not the button)
- You want guard protection by default

**When to Leave Disabled:**
- You want explicit control over when guard runs
- You frequently commit from command palette
- You prefer opt-in guard behavior

---

### Debug and Logging

#### `gitChangelistManager.debug.enableLogging`

**Type:** `boolean`
**Default:** `true`
**Scope:** Global
**Restart Required:** No (takes effect immediately)

**Description:**
Enables verbose DEBUG-level logging to the "Git Changelist Manager" output channel.

**When `true`:**
- Logs DEBUG, INFO, WARN, ERROR, and EVENT messages
- Detailed operation traces (Git operations, state changes, file assignments)
- Useful for troubleshooting and understanding behavior

**When `false`:**
- Logs only INFO, WARN, ERROR, and EVENT messages
- Less verbose output
- Reduces console noise

**Example:**

```json
{
  "gitChangelistManager.debug.enableLogging": false
}
```

**Log Levels:**

| Level | Always Logged | With Debug Enabled |
|-------|---------------|-------------------|
| DEBUG | ❌ | ✓ |
| INFO | ✓ | ✓ |
| WARN | ✓ | ✓ |
| ERROR | ✓ | ✓ |
| EVENT | ✓ | ✓ |

**When to Enable:**
- Investigating unexpected behavior
- Reporting bugs (include logs in issue)
- Understanding how Git Changelist Manager works
- Learning about internal operations

**When to Disable:**
- Stable usage with no issues
- Large repositories (reduces log volume)
- Performance-sensitive environments
- Minimal distraction preference

**Viewing Logs:**
1. Press `Ctrl+Shift+U` / `Cmd+Shift+U` (Output panel)
2. Select "Git Changelist Manager" from dropdown
3. Filter by search if needed

See [DEBUGGING.md](DEBUGGING.md) for more details.

---

### Enhanced UI

#### `gitChangelistManager.ui.inlineDiffPreview.enabled`

**Type:** `boolean`
**Default:** `true`
**Scope:** Global
**Restart Required:** No

**Description:**
Shows an inline diff preview in the tooltip when you hover over a file in a
change list, so you can review what changed without opening the file.

**Behavior:**
- Modified/added/deleted/renamed files show a syntax-highlighted `diff`.
- Untracked files show their leading lines as a synthetic "added" diff (the file
  is read from disk; the Git index is never modified).
- Binary files show `Binary file (no preview)`.
- Previews are computed lazily on hover and cached until the next refresh.

```json
{
  "gitChangelistManager.ui.inlineDiffPreview.enabled": false
}
```

---

#### `gitChangelistManager.ui.inlineDiffPreview.maxLines`

**Type:** `number`
**Default:** `20`
**Minimum:** `5` · **Maximum:** `50`
**Scope:** Global
**Restart Required:** No

**Description:**
Maximum number of diff lines shown in the hover preview. Longer diffs are
truncated with a `... (truncated)` marker. Values outside 5–50 are clamped.

```json
{
  "gitChangelistManager.ui.inlineDiffPreview.maxLines": 30
}
```

---

#### `gitChangelistManager.ui.filter.hideEmptyLists`

**Type:** `boolean`
**Default:** `true`
**Scope:** Global
**Restart Required:** No

**Description:**
While a file filter is active (toolbar filter icon or `Ctrl+Alt+F` / `Cmd+Alt+F`),
hides change lists that have no matching files so only relevant lists remain
visible. When disabled, empty lists stay visible (collapsed) during filtering.

```json
{
  "gitChangelistManager.ui.filter.hideEmptyLists": false
}
```

---

## Configuration Examples

### Minimal Configuration (Defaults)

Use Git Changelist Manager with all default settings:

```json
{}
```

All settings use their default values. This is the recommended starting point for new users.

---

### Power User Configuration

Optimized for experienced users who want maximum control:

```json
{
  "gitChangelistManager.defaultViewMode": "tree",
  "gitChangelistManager.showStatusBar": true,
  "gitChangelistManager.confirmDeleteNonEmpty": false,
  "gitChangelistManager.autoActivateNew": false,
  "gitChangelistManager.commitGuard.enabled": true,
  "gitChangelistManager.commitGuard.interceptCommit": true,
  "gitChangelistManager.autoAssignStagedFiles": true,
  "gitChangelistManager.debug.enableLogging": false
}
```

**Rationale:**
- `tree` mode for structured view of large projects
- Status bar enabled for quick reference
- No delete confirmations (fast workflow)
- Manual activation (explicit control)
- Commit guard enabled with interception (safety by default)
- Auto-assign staged files (consistency)
- Debug logging off (reduced noise)

---

### Minimal Distraction Configuration

For users who want minimal UI and manual control:

```json
{
  "gitChangelistManager.defaultViewMode": "list",
  "gitChangelistManager.showStatusBar": false,
  "gitChangelistManager.confirmDeleteNonEmpty": true,
  "gitChangelistManager.autoActivateNew": false,
  "gitChangelistManager.commitGuard.enabled": false,
  "gitChangelistManager.commitGuard.interceptCommit": false,
  "gitChangelistManager.autoAssignStagedFiles": false,
  "gitChangelistManager.debug.enableLogging": false
}
```

**Rationale:**
- Simple list view
- No status bar clutter
- Manual control over everything
- No automatic behaviors
- Minimal logging

---

### Safety-First Configuration

Maximizes confirmations and guards:

```json
{
  "gitChangelistManager.defaultViewMode": "tree",
  "gitChangelistManager.showStatusBar": true,
  "gitChangelistManager.confirmDeleteNonEmpty": true,
  "gitChangelistManager.autoActivateNew": true,
  "gitChangelistManager.commitGuard.enabled": true,
  "gitChangelistManager.commitGuard.interceptCommit": true,
  "gitChangelistManager.autoAssignStagedFiles": true,
  "gitChangelistManager.debug.enableLogging": true
}
```

**Rationale:**
- All safety features enabled
- Confirmations for destructive operations
- Commit guard always active
- Verbose logging for transparency
- Good for teams or critical projects

---

### Large Project Configuration

Optimized for repositories with 1000+ files:

```json
{
  "gitChangelistManager.defaultViewMode": "list",
  "gitChangelistManager.showStatusBar": true,
  "gitChangelistManager.confirmDeleteNonEmpty": false,
  "gitChangelistManager.autoActivateNew": true,
  "gitChangelistManager.commitGuard.enabled": true,
  "gitChangelistManager.commitGuard.interceptCommit": false,
  "gitChangelistManager.autoAssignStagedFiles": true,
  "gitChangelistManager.debug.enableLogging": false
}
```

**Rationale:**
- List mode for faster rendering (less tree construction overhead)
- Debug logging off to reduce log volume
- No delete confirmations (faster workflow)
- Commit guard available but opt-in (less interruption)

---

## Recommended Configurations

### By Workflow

#### Feature Development Workflow

Multiple features in parallel, clean commits:

```json
{
  "gitChangelistManager.autoActivateNew": true,
  "gitChangelistManager.commitGuard.enabled": true,
  "gitChangelistManager.commitGuard.interceptCommit": true
}
```

#### Experimental/Spike Workflow

Trying different approaches, frequent reorganization:

```json
{
  "gitChangelistManager.confirmDeleteNonEmpty": false,
  "gitChangelistManager.autoActivateNew": false,
  "gitChangelistManager.autoAssignStagedFiles": false
}
```

#### Code Review Preparation

Organizing commits for PRs:

```json
{
  "gitChangelistManager.defaultViewMode": "tree",
  "gitChangelistManager.commitGuard.enabled": true,
  "gitChangelistManager.commitGuard.interceptCommit": true
}
```

---

### By Project Size

#### Small Project (<100 files)

```json
{
  "gitChangelistManager.defaultViewMode": "list",
  "gitChangelistManager.debug.enableLogging": true
}
```

#### Medium Project (100-500 files)

```json
{
  "gitChangelistManager.defaultViewMode": "tree",
  "gitChangelistManager.debug.enableLogging": true
}
```

#### Large Project (500+ files)

```json
{
  "gitChangelistManager.defaultViewMode": "list",
  "gitChangelistManager.debug.enableLogging": false
}
```

---

## Workspace vs Global Settings

Git Changelist Manager settings can be configured at different scopes:

### Global Settings (User)

Apply to all workspaces:
- Located in User settings
- Path: `~/.config/Code/User/settings.json` (Linux/Mac) or `%APPDATA%\Code\User\settings.json` (Windows)

**Best for:**
- Personal preferences (status bar visibility, confirmations)
- Behavioral defaults (auto-activate, auto-assign)
- Debug settings

### Workspace Settings

Apply only to the current workspace:
- Located in workspace settings
- Path: `.vscode/settings.json` in project root

**Best for:**
- View mode preferences (list vs tree)
- Project-specific overrides

### Setting Scope Reference

| Setting | Recommended Scope | Can Override in Workspace? |
|---------|-------------------|---------------------------|
| `defaultViewMode` | Workspace | Yes (recommended) |
| `showStatusBar` | Global | Yes |
| `confirmDeleteNonEmpty` | Global | Yes |
| `autoActivateNew` | Global | Yes |
| `commitGuard.enabled` | Global | Yes |
| `commitGuard.interceptCommit` | Global | Yes |
| `autoAssignStagedFiles` | Global | Yes |
| `debug.enableLogging` | Global | Yes |

### Override Example

**User settings** (global):
```json
{
  "gitChangelistManager.defaultViewMode": "list",
  "gitChangelistManager.showStatusBar": true
}
```

**Workspace settings** (override for large project):
```json
{
  "gitChangelistManager.defaultViewMode": "tree"
}
```

Result: This workspace uses tree mode, all others use list mode.

---

## Troubleshooting Configuration

### Settings Not Taking Effect

**Issue:** Changed a setting but behavior hasn't changed.

**Solutions:**
1. **Check scope**: Workspace settings override global settings
2. **Restart VS Code**: Some settings require restart (`interceptCommit`)
3. **Check spelling**: Setting names are case-sensitive
4. **Check syntax**: Invalid JSON causes settings to be ignored

### Keybinding Conflicts

**Issue:** `Ctrl+Enter` doesn't trigger commit guard.

**Solutions:**
1. **Enable interception**: Set `commitGuard.interceptCommit` to `true`
2. **Restart VS Code**: Keybinding changes require restart
3. **Check keybinding conflicts**: Another extension may override `Ctrl+Enter`
4. **Use Command Palette**: Run `Git Changelist Manager: Commit (with Guard)` instead

### Commit Guard Not Warning

**Issue:** Committing mixed change lists without warning.

**Solutions:**
1. **Check `enabled`**: Ensure `commitGuard.enabled` is `true`
2. **Use keybinding**: Guard only works with `Ctrl+Enter` (if intercepted) or command palette
3. **Not button-triggered**: Native commit button bypasses guard (VS Code limitation)

### Debug Logs Not Appearing

**Issue:** Output channel is empty or missing DEBUG logs.

**Solutions:**
1. **Enable logging**: Set `debug.enableLogging` to `true`
2. **Open correct channel**: Select "Git Changelist Manager" from Output panel dropdown
3. **Check log level**: INFO/WARN/ERROR always logged; DEBUG only when enabled

### View Mode Not Persisting

**Issue:** View mode resets on restart.

**Solutions:**
1. **Set default**: Configure `defaultViewMode` to your preference
2. **Check workspace override**: Workspace setting may override global
3. **Clear state**: Try deleting workspace state (rare corruption)

---

## Advanced Configuration

### Multi-Root Workspaces

Each root can have independent settings:

**Root 1** (`.vscode/settings.json`):
```json
{
  "gitChangelistManager.defaultViewMode": "tree"
}
```

**Root 2** (`.vscode/settings.json`):
```json
{
  "gitChangelistManager.defaultViewMode": "list"
}
```

Each workspace folder respects its own settings.

### Per-Language Defaults (Future)

Not currently supported, but planned:
- Different defaults for TypeScript vs Python projects
- Auto-detect based on `package.json` or `setup.py`

---

## Configuration Schema

Full JSON schema for autocomplete and validation:

Git Changelist Manager's settings are defined in `package.json` under `contributes.configuration`. VS Code automatically provides:
- Autocomplete when editing `settings.json`
- Validation and error messages for invalid values
- IntelliSense documentation on hover

---

## See Also

- [FEATURES.md](FEATURES.md) - Feature details and behavior
- [USER_GUIDE.md](USER_GUIDE.md) - Usage workflows
- [DEBUGGING.md](DEBUGGING.md) - Debug logging guide
- [FAQ.md](FAQ.md) - Common questions

---

Have configuration questions? [Open an issue](https://github.com/Hudson-TR/Git-Changelist-Manager/issues) or check the [FAQ](FAQ.md)!

- [GitHub Repository](https://github.com/Hudson-TR/Git-Changelist-Manager)
