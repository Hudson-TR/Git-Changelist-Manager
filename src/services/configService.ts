import * as vscode from 'vscode';
import {
  CONFIG,
  DEFAULT_DIFF_PREVIEW_MAX_LINES,
  MIN_DIFF_PREVIEW_MAX_LINES,
  MAX_DIFF_PREVIEW_MAX_LINES,
} from '../utils/constants';
import type { ViewMode } from '../types';

/**
 * Service for managing extension configuration
 */
export class ConfigService {
  /**
   * Get the configuration section
   */
  private getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(CONFIG.SECTION);
  }

  /**
   * Get the default view mode (list or tree)
   */
  getDefaultViewMode(): ViewMode {
    return this.getConfig().get<ViewMode>(CONFIG.DEFAULT_VIEW_MODE, 'list');
  }

  /**
   * Get whether to show the status bar item
   */
  getShowStatusBar(): boolean {
    return this.getConfig().get<boolean>(CONFIG.SHOW_STATUS_BAR, true);
  }

  /**
   * Get whether to confirm deletion of non-empty lists
   */
  getConfirmDeleteNonEmpty(): boolean {
    return this.getConfig().get<boolean>(CONFIG.CONFIRM_DELETE_NON_EMPTY, true);
  }

  /**
   * Get whether to auto-activate newly created lists
   */
  getAutoActivateNew(): boolean {
    return this.getConfig().get<boolean>(CONFIG.AUTO_ACTIVATE_NEW, true);
  }

  /**
   * Get whether commit guard is enabled
   */
  getCommitGuardEnabled(): boolean {
    return this.getConfig().get<boolean>(CONFIG.COMMIT_GUARD_ENABLED, true);
  }

  /**
   * Get whether to intercept the native commit command
   */
  getInterceptCommit(): boolean {
    return this.getConfig().get<boolean>(CONFIG.INTERCEPT_COMMIT, false);
  }

  /**
   * Get whether to auto-assign externally staged files to active list
   */
  getAutoAssignStagedFiles(): boolean {
    return this.getConfig().get<boolean>(CONFIG.AUTO_ASSIGN_STAGED, true);
  }

  /**
   * Get whether debug logging is enabled
   */
  getDebugLoggingEnabled(): boolean {
    return this.getConfig().get<boolean>(CONFIG.DEBUG_LOGGING, false);
  }

  /**
   * Get whether inline diff previews are shown on file hover
   */
  getInlineDiffPreviewEnabled(): boolean {
    return this.getConfig().get<boolean>(CONFIG.INLINE_DIFF_PREVIEW_ENABLED, true);
  }

  /**
   * Get the maximum number of diff lines shown in an inline preview.
   * The configured value is clamped to the supported range.
   */
  getInlineDiffPreviewMaxLines(): number {
    const raw = this.getConfig().get<number>(
      CONFIG.INLINE_DIFF_PREVIEW_MAX_LINES,
      DEFAULT_DIFF_PREVIEW_MAX_LINES
    );
    if (typeof raw !== 'number' || Number.isNaN(raw)) {
      return DEFAULT_DIFF_PREVIEW_MAX_LINES;
    }
    return Math.min(
      MAX_DIFF_PREVIEW_MAX_LINES,
      Math.max(MIN_DIFF_PREVIEW_MAX_LINES, Math.floor(raw))
    );
  }

  /**
   * Get whether empty changelists are hidden while a filter is active
   */
  getFilterHideEmptyLists(): boolean {
    return this.getConfig().get<boolean>(CONFIG.FILTER_HIDE_EMPTY_LISTS, true);
  }

  /**
   * Listen for configuration changes
   */
  onDidChangeConfiguration(
    callback: (e: vscode.ConfigurationChangeEvent) => void
  ): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(CONFIG.SECTION)) {
        callback(e);
      }
    });
  }
}
