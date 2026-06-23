import * as crypto from 'crypto';
import * as vscode from 'vscode';

/**
 * Generate a new UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get the current timestamp in milliseconds
 */
export function now(): number {
  return Date.now();
}

/**
 * Get relative path from workspace root
 */
export function getRelativePath(uri: vscode.Uri, workspaceRoot: vscode.Uri): string {
  const rootPath = workspaceRoot.fsPath;
  const filePath = uri.fsPath;

  if (filePath.startsWith(rootPath)) {
    let relative = filePath.substring(rootPath.length);
    // Remove leading separator
    if (relative.startsWith('/') || relative.startsWith('\\')) {
      relative = relative.substring(1);
    }
    return relative;
  }

  return filePath;
}

/**
 * Normalize path separators to forward slashes
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Get directory path from file path
 */
export function getDirectoryPath(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash > 0 ? normalized.substring(0, lastSlash) : '';
}

/**
 * Get filename from path
 */
export function getFileName(filePath: string): string {
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
}

/**
 * Split path into segments
 */
export function splitPath(filePath: string): string[] {
  return normalizePath(filePath).split('/').filter(Boolean);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, delay);
  };
}

/**
 * Group items by a key function
 */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();

  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }

  return map;
}

/**
 * Sort change lists with Default first, then active, then by name
 */
export function sortChangeLists<T extends { isDefault: boolean; isActive: boolean; name: string }>(
  lists: T[]
): T[] {
  return [...lists].sort((a, b) => {
    // Default list always first
    if (a.isDefault !== b.isDefault) {
      return a.isDefault ? -1 : 1;
    }
    // Active list second
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Build a trie (prefix tree) from file paths for tree view
 */
export interface PathTrieNode {
  name: string;
  fullPath: string;
  children: Map<string, PathTrieNode>;
  files: string[];
}

export function buildPathTrie(paths: string[]): PathTrieNode {
  const root: PathTrieNode = {
    name: '',
    fullPath: '',
    children: new Map(),
    files: [],
  };

  for (const path of paths) {
    const segments = splitPath(path);
    let current = root;
    let currentPath = '';

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      let child = current.children.get(segment);
      if (!child) {
        child = {
          name: segment,
          fullPath: currentPath,
          children: new Map(),
          files: [],
        };
        current.children.set(segment, child);
      }
      current = child;
    }

    // Add the file to the current directory
    current.files.push(path);
  }

  return root;
}

/**
 * Format file count for display
 */
export function formatFileCount(count: number): string {
  if (count === 0) {
    return 'empty';
  }
  if (count === 1) {
    return '1 file';
  }
  return `${count} files`;
}

/**
 * Determine whether a file matches a free-text filter query.
 *
 * Matching is case-insensitive. The query is split on whitespace into terms,
 * and ALL terms must be found (AND semantics) in either the file name or the
 * relative path. An empty/whitespace-only query matches everything.
 *
 * @param relativePath - Path relative to the workspace root (e.g. "src/utils/helpers.ts")
 * @param fileName - Just the file name (e.g. "helpers.ts")
 * @param query - The user-provided filter string
 */
export function matchesChangelistFilter(
  relativePath: string,
  fileName: string,
  query: string
): boolean {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return true;
  }

  const haystackPath = relativePath.toLowerCase();
  const haystackName = fileName.toLowerCase();
  const terms = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

  // AND semantics: every term must match either the name or the relative path
  return terms.every(
    (term) => haystackName.includes(term) || haystackPath.includes(term)
  );
}

/**
 * Truncate a label to a maximum length, appending an ellipsis when cut.
 * Short labels are returned unchanged.
 *
 * @param label - The label to truncate
 * @param maxLength - Maximum number of characters (including the ellipsis)
 */
export function truncateLabel(label: string, maxLength: number): string {
  if (maxLength <= 0) {
    return '';
  }
  if (label.length <= maxLength) {
    return label;
  }
  if (maxLength === 1) {
    return '…';
  }
  return `${label.substring(0, maxLength - 1)}…`;
}
