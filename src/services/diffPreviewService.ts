import * as vscode from 'vscode';
import { TrackedChange, GitFileStatus } from '../types';
import { GitService } from './gitService';
import { ConfigService } from './configService';
import { DIFF_PREVIEW_CACHE_SIZE } from '../utils/constants';
import {
  buildDiffTooltip,
  buildMessageTooltip,
  hasBinaryExtension,
  isLikelyBinary,
  truncateDiffLines,
} from '../utils/diffPreview';
import { logger } from '../utils/logger';

/** Number of leading bytes to read from untracked files for previews. */
const UNTRACKED_READ_BYTES = 8192;

/**
 * Produces inline diff preview tooltips for changed files.
 *
 * Tooltips are rendered lazily (via the tree provider's `resolveTreeItem`) and
 * cached in a small in-memory LRU keyed by file path + git status. The cache is
 * cleared whenever the tree refreshes so previews never go stale.
 */
export class DiffPreviewService implements vscode.Disposable {
  private readonly cache = new Map<string, vscode.MarkdownString>();

  constructor(
    private readonly gitService: GitService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Build (or retrieve from cache) the tooltip for a changed file.
   * Returns `undefined` if no meaningful preview can be produced.
   */
  async getTooltip(change: TrackedChange): Promise<vscode.MarkdownString | undefined> {
    const key = this.cacheKey(change);

    const cached = this.cache.get(key);
    if (cached) {
      // Refresh LRU recency.
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }

    const tooltip = await this.buildTooltip(change);
    if (tooltip) {
      this.store(key, tooltip);
    }
    return tooltip;
  }

  /**
   * Clear the preview cache (called when the tree refreshes).
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Compose the relative-path heading + status + diff body into a tooltip.
   */
  private async buildTooltip(change: TrackedChange): Promise<vscode.MarkdownString | undefined> {
    const filePath = change.resourceUri.fsPath;
    const maxLines = this.configService.getInlineDiffPreviewMaxLines();

    // 1. Cheap binary check by extension.
    if (hasBinaryExtension(filePath)) {
      return buildMessageTooltip(`${change.relativePath}\nBinary file (no preview)`);
    }

    // 2. Untracked files: read from disk (avoid mutating the git index).
    if (change.gitStatus === GitFileStatus.Untracked) {
      return this.buildUntrackedTooltip(change, maxLines);
    }

    // 3. Tracked files: ask git for the diff.
    const diff = await this.gitService.getDiffPreview(change.resourceUri, change.gitStatus);
    if (!diff || diff.trim().length === 0) {
      return buildMessageTooltip(`${change.relativePath}\nNo changes to preview`);
    }

    const truncated = truncateDiffLines(diff, maxLines);
    return buildDiffTooltip(truncated, 'diff');
  }

  /**
   * Build a synthetic diff tooltip for an untracked file by reading its leading
   * bytes from disk and rendering them as added lines.
   */
  private async buildUntrackedTooltip(
    change: TrackedChange,
    maxLines: number
  ): Promise<vscode.MarkdownString | undefined> {
    try {
      const bytes = await vscode.workspace.fs.readFile(change.resourceUri);
      const head = bytes.subarray(0, UNTRACKED_READ_BYTES);

      if (isLikelyBinary(head)) {
        return buildMessageTooltip(`${change.relativePath}\nBinary file (no preview)`);
      }

      const text = Buffer.from(head).toString('utf8');
      if (text.length === 0) {
        return buildMessageTooltip(`${change.relativePath}\nEmpty file`);
      }

      // Render as a synthetic "new file" diff: prefix each line with '+'.
      const lines = text.replace(/\r\n/g, '\n').split('\n');
      const synthetic = lines.map((line) => `+${line}`).join('\n');
      const body = truncateDiffLines(synthetic, maxLines);

      return buildDiffTooltip(`+++ ${change.relativePath} (untracked)\n${body}`, 'diff');
    } catch (error) {
      logger.debug('DiffPreviewService: failed to read untracked file', {
        file: change.resourceUri.fsPath,
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  }

  /**
   * Insert into the LRU cache, evicting the oldest entry when over capacity.
   */
  private store(key: string, value: vscode.MarkdownString): void {
    this.cache.set(key, value);
    if (this.cache.size > DIFF_PREVIEW_CACHE_SIZE) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) {
        this.cache.delete(oldest);
      }
    }
  }

  private cacheKey(change: TrackedChange): string {
    return `${change.resourceUri.fsPath}::${change.gitStatus}`;
  }

  dispose(): void {
    this.clearCache();
  }
}
