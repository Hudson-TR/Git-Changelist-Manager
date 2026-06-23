/**
 * Extension constants
 */

/** Extension identifier */
export const EXTENSION_ID = 'git-changelist-manager';

/** View identifiers */
export const VIEW_ID = 'gitChangelistManager.changelists';

/** Command identifiers */
export const COMMANDS = {
  CREATE_LIST: 'gitChangelistManager.createList',
  DELETE_LIST: 'gitChangelistManager.deleteList',
  RENAME_LIST: 'gitChangelistManager.renameList',
  SET_ACTIVE_LIST: 'gitChangelistManager.setActiveList',
  MOVE_TO_LIST: 'gitChangelistManager.moveToList',
  COMMIT_LIST: 'gitChangelistManager.commitList',
  STAGE_LIST: 'gitChangelistManager.stageList',
  TOGGLE_VIEW_MODE: 'gitChangelistManager.toggleViewMode',
  APPLY_PATCH: 'gitChangelistManager.applyPatch',
  CREATE_PATCH: 'gitChangelistManager.createPatch',
  REFRESH: 'gitChangelistManager.refresh',
  GUARDED_COMMIT: 'gitChangelistManager.guardedCommit',
  SET_LIST_COLOR: 'gitChangelistManager.setListColor',
  FILTER_CHANGELISTS: 'gitChangelistManager.filterChangelists',
  CLEAR_FILTER: 'gitChangelistManager.clearFilterChangelists',
  OPEN_FILE_DIFF: 'gitChangelistManager.openFileDiff',
} as const;

/** Configuration keys */
export const CONFIG = {
  SECTION: 'gitChangelistManager',
  DEFAULT_VIEW_MODE: 'defaultViewMode',
  SHOW_STATUS_BAR: 'showStatusBar',
  CONFIRM_DELETE_NON_EMPTY: 'confirmDeleteNonEmpty',
  AUTO_ACTIVATE_NEW: 'autoActivateNew',
  COMMIT_GUARD_ENABLED: 'commitGuard.enabled',
  INTERCEPT_COMMIT: 'commitGuard.interceptCommit',
  AUTO_ASSIGN_STAGED: 'autoAssignStagedFiles',
  DEBUG_LOGGING: 'debug.enableLogging',
  INLINE_DIFF_PREVIEW_ENABLED: 'ui.inlineDiffPreview.enabled',
  INLINE_DIFF_PREVIEW_MAX_LINES: 'ui.inlineDiffPreview.maxLines',
  FILTER_HIDE_EMPTY_LISTS: 'ui.filter.hideEmptyLists',
} as const;

/** Storage keys */
export const STORAGE_KEYS = {
  CHANGE_LIST_STATE: 'gitChangelistManager.changeListState',
  VIEW_MODE: 'gitChangelistManager.viewMode',
  EXPANSION_STATE: 'gitChangelistManager.expansionState',
} as const;

/** Context keys for when clauses */
export const CONTEXT_KEYS = {
  LIST_IS_DEFAULT: 'listIsDefault',
  LIST_IS_ACTIVE: 'listIsActive',
  HAS_CHANGES: 'gitChangelistManager.hasChanges',
  FILTER_ACTIVE: 'gitChangelistManager.filterActive',
} as const;

/** Default change list name */
export const DEFAULT_LIST_NAME = 'Default';

/** Default number of diff lines to show in an inline preview tooltip */
export const DEFAULT_DIFF_PREVIEW_MAX_LINES = 20;

/** Minimum allowed inline diff preview line count */
export const MIN_DIFF_PREVIEW_MAX_LINES = 5;

/** Maximum allowed inline diff preview line count */
export const MAX_DIFF_PREVIEW_MAX_LINES = 50;

/** Maximum number of cached diff previews kept in memory (LRU) */
export const DIFF_PREVIEW_CACHE_SIZE = 50;

/** Maximum label length for the status bar active-list indicator */
export const STATUS_BAR_MAX_LABEL = 16;

/** Unversioned files list ID */
export const UNVERSIONED_LIST_ID = 'virtual-unversioned-files-list';

/** Current schema version for state persistence */
export const STATE_SCHEMA_VERSION = 1;

/** Debounce delay for refresh operations (ms) */
export const REFRESH_DEBOUNCE_MS = 150;

/** MIME type for drag and drop operations */
export const DRAG_MIME_TYPE = 'application/vnd.code.tree.gitchangelists.changelists';

/** Tree item context values */
export const CONTEXT_VALUES = {
  CHANGE_LIST: 'changeList',
  CHANGE_LIST_DEFAULT: 'changeListDefault',
  CHANGE_LIST_ACTIVE: 'changeListActive',
  CHANGE_LIST_READONLY: 'changeListReadOnly',
  DIRECTORY: 'changeListDirectory',
  FILE: 'changeListFile',
} as const;
