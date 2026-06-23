import * as vscode from 'vscode';
import type { ChangeListManager } from '../services/changeListManager';
import type { GitService } from '../services/gitService';
import type { ConfigService } from '../services/configService';
import { COMMANDS, STATUS_BAR_MAX_LABEL, DEFAULT_LIST_NAME } from '../utils/constants';
import { truncateLabel } from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * Shows the active change list in the status bar and lets the user switch
 * lists with a single click.
 *
 * Visibility rules (all must hold for the item to be shown):
 * - the `showStatusBar` setting is enabled,
 * - a Git repository is available,
 * - at least one workspace folder is open.
 *
 * The item text uses the documented bracket format, e.g. `[Default]`, and is
 * tinted with the active list's color when one is set.
 */
export class StatusBarIntegration implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly changeListManager: ChangeListManager,
    private readonly gitService: GitService,
    private readonly configService: ConfigService
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    // Clicking the item opens the "set active changelist" quick pick.
    this.statusBarItem.command = COMMANDS.SET_ACTIVE_LIST;

    // React to changelist, git, and configuration changes.
    this.disposables.push(
      this.changeListManager.onDidChange(() => this.update()),
      this.gitService.onDidChangeState(() => this.update()),
      this.configService.onDidChangeConfiguration(() => this.update()),
      vscode.workspace.onDidChangeWorkspaceFolders(() => this.update())
    );

    this.update();
  }

  /**
   * Recompute the status bar item's visibility and content.
   */
  private update(): void {
    const enabled = this.configService.getShowStatusBar();
    const hasRepo = this.gitService.hasRepository();
    const hasWorkspace = (vscode.workspace.workspaceFolders?.length ?? 0) > 0;

    if (!enabled || !hasRepo || !hasWorkspace) {
      this.statusBarItem.hide();
      return;
    }

    const activeList = this.changeListManager.getActiveList();
    const name = activeList?.name ?? DEFAULT_LIST_NAME;
    const label = truncateLabel(name, STATUS_BAR_MAX_LABEL);

    this.statusBarItem.text = `$(list-selection) [${label}]`;
    this.statusBarItem.tooltip = `Active changelist: ${name}\nClick to switch active changelist`;
    this.statusBarItem.color = activeList?.color
      ? new vscode.ThemeColor(activeList.color)
      : undefined;

    this.statusBarItem.show();
    logger.debug('StatusBar: Updated', { active: name });
  }

  dispose(): void {
    this.statusBarItem.dispose();
    this.disposables.forEach((d) => d.dispose());
  }
}
