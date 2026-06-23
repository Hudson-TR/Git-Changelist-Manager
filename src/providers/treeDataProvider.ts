import * as vscode from 'vscode';
import {
  AnyTreeNode,
  ChangeListNode,
  DirectoryNode,
  FileNode,
  TrackedChange,
  ViewMode,
  GitFileStatus,
} from '../types';
import { ChangeListManager } from '../services/changeListManager';
import { GitService } from '../services/gitService';
import { ConfigService } from '../services/configService';
import { DiffPreviewService } from '../services/diffPreviewService';
import {
  CONTEXT_VALUES,
  STORAGE_KEYS,
  COMMANDS,
} from '../utils/constants';
import {
  sortChangeLists,
  buildPathTrie,
  formatFileCount,
  getFileName,
  normalizePath,
  matchesChangelistFilter,
} from '../utils/helpers';
import { logger } from '../utils/logger';

/**
 * Tree data provider for the change lists view
 */
export class ChangeListTreeDataProvider
  implements vscode.TreeDataProvider<AnyTreeNode>, vscode.Disposable {
  private _onDidChangeTreeData = new vscode.EventEmitter<AnyTreeNode | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private viewMode: ViewMode;
  private cachedChanges: Map<string, TrackedChange[]> = new Map();
  private filterQuery = '';

  constructor(
    private readonly changeListManager: ChangeListManager,
    private readonly gitService: GitService,
    private readonly configService: ConfigService,
    private readonly diffPreviewService?: DiffPreviewService
  ) {
    this.viewMode = configService.getDefaultViewMode();
  }

  /**
   * Refresh the tree view
   */
  refresh(element?: AnyTreeNode): void {
    logger.debug('TreeDataProvider: Refreshing tree view', {
      element: element ? element.type : 'all',
      viewMode: this.viewMode,
    });
    this.cachedChanges.clear();
    this.diffPreviewService?.clearCache();
    this._onDidChangeTreeData.fire(element);
  }

  /**
   * Get current view mode
   */
  getViewMode(): ViewMode {
    return this.viewMode;
  }

  /**
   * Toggle between list and tree view modes
   */
  toggleViewMode(): void {
    const oldMode = this.viewMode;
    this.viewMode = this.viewMode === 'list' ? 'tree' : 'list';
    logger.info('TreeDataProvider: View mode toggled', {
      from: oldMode,
      to: this.viewMode,
    });
    this.refresh();
  }

  /**
   * Set view mode
   */
  setViewMode(mode: ViewMode): void {
    if (this.viewMode !== mode) {
      this.viewMode = mode;
      this.refresh();
    }
  }

  /**
   * Set the active filter query and refresh the tree.
   */
  setFilterQuery(query: string): void {
    const next = query ?? '';
    if (this.filterQuery !== next) {
      this.filterQuery = next;
      logger.info('TreeDataProvider: Filter query set', { query: next });
      this.refresh();
    }
  }

  /**
   * Clear the active filter and refresh the tree.
   */
  clearFilter(): void {
    if (this.filterQuery !== '') {
      this.filterQuery = '';
      logger.info('TreeDataProvider: Filter cleared');
      this.refresh();
    }
  }

  /**
   * Get the current filter query.
   */
  getFilterQuery(): string {
    return this.filterQuery;
  }

  /**
   * Whether a non-empty filter is currently active.
   */
  hasActiveFilter(): boolean {
    return this.filterQuery.trim().length > 0;
  }

  /**
   * Count the total number of files matching the active filter across all
   * change lists. Used to drive the tree view's "no results" message.
   */
  async countFilterMatches(): Promise<number> {
    if (!this.hasActiveFilter()) {
      return 0;
    }
    const lists = this.changeListManager.getLists();
    let total = 0;
    for (const list of lists) {
      const files = await this.getFilteredFilesForList(list.id);
      total += files.length;
    }
    return total;
  }

  /**
   * Resolve a tree item lazily to attach an inline diff preview tooltip.
   * Only file nodes are resolved, and only when the feature is enabled.
   */
  async resolveTreeItem(
    item: vscode.TreeItem,
    element: AnyTreeNode,
    token: vscode.CancellationToken
  ): Promise<vscode.TreeItem> {
    if (element.type !== 'file') {
      return item;
    }
    if (!this.diffPreviewService || !this.configService.getInlineDiffPreviewEnabled()) {
      return item;
    }
    if (token.isCancellationRequested) {
      return item;
    }

    try {
      const tooltip = await this.diffPreviewService.getTooltip(element.change);
      if (!token.isCancellationRequested && tooltip) {
        item.tooltip = tooltip;
      }
    } catch (error) {
      logger.debug('TreeDataProvider: resolveTreeItem preview failed', {
        file: element.change.resourceUri.fsPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return item;
  }

  /**
   * Get tree item for a node
   */
  getTreeItem(element: AnyTreeNode): vscode.TreeItem {
    switch (element.type) {
      case 'changeList':
        return this.createChangeListItem(element);
      case 'directory':
        return this.createDirectoryItem(element);
      case 'file':
        return this.createFileItem(element);
    }
  }

  /**
   * Get children of a node
   */
  async getChildren(element?: AnyTreeNode): Promise<AnyTreeNode[]> {
    if (!this.gitService.hasRepository()) {
      return [];
    }

    // Root level: return change lists
    if (!element) {
      return this.getChangeListNodes();
    }

    // Change list level
    if (element.type === 'changeList') {
      const files = await this.getFilteredFilesForList(element.changeList.id);

      if (this.viewMode === 'list') {
        return this.createFileNodes(files);
      } else {
        return this.createTreeNodes(files, element.changeList.id);
      }
    }

    // Directory level (tree mode only)
    if (element.type === 'directory') {
      return this.getDirectoryChildren(element);
    }

    return [];
  }

  /**
   * Get parent of a node (for reveal)
   */
  getParent(element: AnyTreeNode): AnyTreeNode | undefined {
    if (element.type === 'file') {
      const listId = element.change.changeListId;
      const list = this.changeListManager.getList(listId);
      if (list) {
        return {
          type: 'changeList',
          id: list.id,
          label: list.name,
          changeList: list,
          fileCount: 0, // Will be updated on refresh
          counts: { modified: 0, added: 0, deleted: 0, renamed: 0, untracked: 0 },
        };
      }
    }

    if (element.type === 'directory') {
      // For directories, return parent directory or change list
      const parentPath = this.getParentPath(element.path);
      if (parentPath) {
        return {
          type: 'directory',
          id: `${element.changeListId}:${parentPath}`,
          label: getFileName(parentPath),
          changeListId: element.changeListId,
          path: parentPath,
          childCount: 0,
        };
      }
      const list = this.changeListManager.getList(element.changeListId);
      if (list) {
        return {
          type: 'changeList',
          id: list.id,
          label: list.name,
          changeList: list,
          fileCount: 0,
          counts: { modified: 0, added: 0, deleted: 0, renamed: 0, untracked: 0 },
        };
      }
    }

    return undefined;
  }

  /**
   * Get change list nodes
   */
  private async getChangeListNodes(): Promise<ChangeListNode[]> {
    const lists = this.changeListManager.getLists();
    const sortedLists = sortChangeLists([...lists]);

    const nodes: ChangeListNode[] = [];
    const filterActive = this.hasActiveFilter();
    const hideEmpty = filterActive && this.configService.getFilterHideEmptyLists();

    for (const list of sortedLists) {
      const files = await this.getFilteredFilesForList(list.id);

      // While filtering, optionally hide lists that have no matching files.
      if (hideEmpty && files.length === 0) {
        continue;
      }

      // Calculate counts
      const counts = {
        modified: 0,
        added: 0,
        deleted: 0,
        renamed: 0,
        untracked: 0,
      };

      for (const file of files) {
        switch (file.gitStatus) {
          case GitFileStatus.Modified:
            counts.modified++;
            break;
          case GitFileStatus.Added:
            counts.added++;
            break;
          case GitFileStatus.Deleted:
            counts.deleted++;
            break;
          case GitFileStatus.Renamed:
            counts.renamed++;
            break;
          case GitFileStatus.Untracked:
            counts.untracked++;
            break;
          case GitFileStatus.Conflict:
            counts.modified++;
            break;
        }
      }

      nodes.push({
        type: 'changeList',
        id: list.id,
        label: list.name,
        changeList: list,
        fileCount: files.length,
        counts,
      });
    }

    return nodes;
  }

  /**
   * Get files for a change list (with caching)
   */
  private async getFilesForList(listId: string): Promise<TrackedChange[]> {
    if (this.cachedChanges.has(listId)) {
      return this.cachedChanges.get(listId)!;
    }

    const files = await this.changeListManager.getFilesForList(listId);
    this.cachedChanges.set(listId, files);
    return files;
  }

  /**
   * Get files for a change list with the active text filter applied.
   */
  private async getFilteredFilesForList(listId: string): Promise<TrackedChange[]> {
    const files = await this.getFilesForList(listId);
    return this.applyFilter(files);
  }

  /**
   * Filter a set of files by the active filter query (no-op when inactive).
   */
  private applyFilter(files: TrackedChange[]): TrackedChange[] {
    if (!this.hasActiveFilter()) {
      return files;
    }
    return files.filter((file) =>
      matchesChangelistFilter(file.relativePath, getFileName(file.relativePath), this.filterQuery)
    );
  }

  /**
   * Create file nodes for list view
   */
  private createFileNodes(files: TrackedChange[]): FileNode[] {
    return files
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
      .map((file) => ({
        type: 'file' as const,
        id: file.resourceUri.fsPath,
        label: getFileName(file.relativePath),
        change: file,
      }));
  }

  /**
   * Create tree nodes for tree view
   */
  private createTreeNodes(files: TrackedChange[], listId: string): AnyTreeNode[] {
    if (files.length === 0) {
      return [];
    }

    const paths = files.map((f) => normalizePath(f.relativePath));
    const trie = buildPathTrie(paths);

    const nodes: AnyTreeNode[] = [];

    // Add directories
    for (const [name, child] of trie.children) {
      const fileCount = this.countFilesInTrie(child);
      nodes.push({
        type: 'directory',
        id: `${listId}:${child.fullPath}`,
        label: name,
        changeListId: listId,
        path: child.fullPath,
        childCount: fileCount,
      });
    }

    // Add root-level files
    for (const filePath of trie.files) {
      const file = files.find((f) => normalizePath(f.relativePath) === filePath);
      if (file) {
        nodes.push({
          type: 'file',
          id: file.resourceUri.fsPath,
          label: getFileName(filePath),
          change: file,
        });
      }
    }

    // Sort: directories first, then files, both alphabetically
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });
  }

  /**
   * Get children of a directory node
   */
  private async getDirectoryChildren(dir: DirectoryNode): Promise<AnyTreeNode[]> {
    const files = await this.getFilteredFilesForList(dir.changeListId);
    const dirPath = normalizePath(dir.path);

    const nodes: AnyTreeNode[] = [];
    const seenDirs = new Set<string>();

    for (const file of files) {
      const relativePath = normalizePath(file.relativePath);

      if (!relativePath.startsWith(dirPath + '/')) {
        continue;
      }

      const remainder = relativePath.substring(dirPath.length + 1);
      const parts = remainder.split('/');

      if (parts.length === 1) {
        // Direct child file
        nodes.push({
          type: 'file',
          id: file.resourceUri.fsPath,
          label: parts[0],
          change: file,
        });
      } else {
        // Subdirectory
        const subDirName = parts[0];
        const subDirPath = `${dirPath}/${subDirName}`;

        if (!seenDirs.has(subDirPath)) {
          seenDirs.add(subDirPath);
          const childCount = this.countFilesInDirectory(files, subDirPath);
          nodes.push({
            type: 'directory',
            id: `${dir.changeListId}:${subDirPath}`,
            label: subDirName,
            changeListId: dir.changeListId,
            path: subDirPath,
            childCount,
          });
        }
      }
    }

    // Sort: directories first, then files
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.label.localeCompare(b.label);
    });
  }

  /**
   * Count files in a trie node recursively
   */
  private countFilesInTrie(node: { files: string[]; children: Map<string, unknown> }): number {
    let count = node.files.length;
    for (const child of node.children.values()) {
      count += this.countFilesInTrie(child as typeof node);
    }
    return count;
  }

  /**
   * Count files in a directory
   */
  private countFilesInDirectory(files: TrackedChange[], dirPath: string): number {
    const normalized = normalizePath(dirPath);
    return files.filter((f) =>
      normalizePath(f.relativePath).startsWith(normalized + '/')
    ).length;
  }

  /**
   * Get parent path
   */
  private getParentPath(path: string): string | undefined {
    const normalized = normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash > 0 ? normalized.substring(0, lastSlash) : undefined;
  }

  /**
   * Create tree item for change list
   */
  private createChangeListItem(node: ChangeListNode): vscode.TreeItem {
    const item = new vscode.TreeItem(
      node.changeList.name,
      node.fileCount > 0
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed
    );

    item.id = node.id;
    item.id = node.id;

    // Format description with simple badges
    // e.g. "5 files (2 M, 1 A)"
    const badges: string[] = [];
    if (node.counts.modified > 0) { badges.push(`${node.counts.modified} M`); }
    if (node.counts.added > 0) { badges.push(`${node.counts.added} A`); }
    if (node.counts.deleted > 0) { badges.push(`${node.counts.deleted} D`); }
    if (node.counts.renamed > 0) { badges.push(`${node.counts.renamed} R`); }
    if (node.counts.untracked > 0) { badges.push(`${node.counts.untracked} U`); }

    const countStr = formatFileCount(node.fileCount);
    item.description = badges.length > 0 ? `${countStr} (${badges.join(', ')})` : countStr;

    // Set icon based on state
    if (node.changeList.isActive) {
      // Active list gets a special check icon, potentially colored if color is set
      const color = node.changeList.color ? new vscode.ThemeColor(node.changeList.color) : new vscode.ThemeColor('charts.green');
      item.iconPath = new vscode.ThemeIcon('check', color);
    } else if (node.changeList.isDefault) {
      // Default list
      const color = node.changeList.color ? new vscode.ThemeColor(node.changeList.color) : undefined;
      item.iconPath = new vscode.ThemeIcon('folder', color);
    } else {
      // Regular list
      const color = node.changeList.color ? new vscode.ThemeColor(node.changeList.color) : new vscode.ThemeColor('icon.foreground');
      item.iconPath = new vscode.ThemeIcon('folder-opened', color);
    }

    // Tooltip
    const tooltipLines = [node.changeList.name];
    if (node.changeList.description) {
      tooltipLines.push(node.changeList.description);
    }
    if (node.changeList.isActive) {
      tooltipLines.push('(Active)');
    }
    if (node.changeList.isDefault) {
      tooltipLines.push('(Default)');
    }
    item.tooltip = tooltipLines.join('\n');

    // Context value for menus
    if (node.changeList.isReadOnly) {
      item.contextValue = CONTEXT_VALUES.CHANGE_LIST_READONLY;
      item.iconPath = new vscode.ThemeIcon('question', new vscode.ThemeColor('gitDecoration.untrackedResourceForeground'));
    } else if (node.changeList.isDefault) {
      item.contextValue = CONTEXT_VALUES.CHANGE_LIST_DEFAULT;
    } else if (node.changeList.isActive) {
      item.contextValue = CONTEXT_VALUES.CHANGE_LIST_ACTIVE;
    } else {
      item.contextValue = CONTEXT_VALUES.CHANGE_LIST;
    }

    return item;
  }

  /**
   * Create tree item for directory
   */
  private createDirectoryItem(node: DirectoryNode): vscode.TreeItem {
    const item = new vscode.TreeItem(
      node.label,
      vscode.TreeItemCollapsibleState.Collapsed
    );

    item.id = node.id;
    item.description = `${node.childCount}`;
    item.iconPath = vscode.ThemeIcon.Folder;
    item.contextValue = CONTEXT_VALUES.DIRECTORY;

    return item;
  }

  /**
   * Create tree item for file
   */
  private createFileItem(node: FileNode): vscode.TreeItem {
    const item = new vscode.TreeItem(node.label);

    item.id = node.id;
    item.resourceUri = node.change.resourceUri;

    // Show relative path in description for list mode
    if (this.viewMode === 'list') {
      const dir = this.getParentPath(node.change.relativePath);
      if (dir) {
        item.description = dir;
      }
    }

    // Set icon based on Git status
    item.iconPath = this.getStatusIcon(node.change.gitStatus);

    // Clicking a file opens the comparison (diff) view when possible.
    item.command = {
      command: COMMANDS.OPEN_FILE_DIFF,
      title: 'Open Changes',
      arguments: [node],
    };

    item.contextValue = CONTEXT_VALUES.FILE;
    // NOTE: deliberately leave `tooltip` undefined so VS Code invokes
    // resolveTreeItem(), which lazily builds the inline diff preview. Setting a
    // tooltip here would suppress that call.

    return item;
  }

  /**
   * Get icon for Git status
   */
  private getStatusIcon(status: GitFileStatus): vscode.ThemeIcon {
    switch (status) {
      case GitFileStatus.Modified:
        return new vscode.ThemeIcon('diff-modified', new vscode.ThemeColor('gitDecoration.modifiedResourceForeground'));
      case GitFileStatus.Added:
        return new vscode.ThemeIcon('diff-added', new vscode.ThemeColor('gitDecoration.addedResourceForeground'));
      case GitFileStatus.Deleted:
        return new vscode.ThemeIcon('diff-removed', new vscode.ThemeColor('gitDecoration.deletedResourceForeground'));
      case GitFileStatus.Renamed:
        return new vscode.ThemeIcon('diff-renamed', new vscode.ThemeColor('gitDecoration.renamedResourceForeground'));
      case GitFileStatus.Untracked:
        return new vscode.ThemeIcon('question', new vscode.ThemeColor('gitDecoration.untrackedResourceForeground'));
      case GitFileStatus.Conflict:
        return new vscode.ThemeIcon('warning', new vscode.ThemeColor('gitDecoration.conflictingResourceForeground'));
      default:
        return new vscode.ThemeIcon('file');
    }
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
