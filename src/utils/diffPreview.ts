import * as vscode from 'vscode';

/**
 * Pure helpers for building inline diff preview tooltips.
 *
 * These functions are intentionally free of any VS Code runtime dependency
 * except for {@link buildDiffTooltip}, which produces a `MarkdownString`.
 * Keeping the string-manipulation helpers pure makes them trivially unit
 * testable without the extension host.
 */

/** Common binary file extensions for which a textual preview is meaningless. */
const BINARY_EXTENSIONS = new Set([
  // Images
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'webp', 'tiff', 'tif', 'avif',
  // Documents / archives
  'pdf', 'zip', 'gz', 'tar', 'rar', '7z', 'bz2', 'xz', 'jar', 'war',
  // Media
  'mp3', 'mp4', 'wav', 'ogg', 'flac', 'avi', 'mov', 'mkv', 'webm',
  // Fonts
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  // Binaries / native
  'exe', 'dll', 'so', 'dylib', 'bin', 'class', 'o', 'a', 'lib', 'obj',
  'wasm', 'node', 'pyc', 'pyd',
  // Misc binary-ish
  'sqlite', 'db', 'dat', 'ds_store',
]);

/**
 * Heuristically determine whether a file path is a binary file based on its
 * extension. This is a cheap first-pass check before reading file contents.
 */
export function hasBinaryExtension(filePath: string): boolean {
  const match = /\.([^.\\/]+)$/.exec(filePath);
  if (!match) {
    return false;
  }
  return BINARY_EXTENSIONS.has(match[1].toLowerCase());
}

/**
 * Heuristically determine whether a buffer contains binary content.
 *
 * The check inspects up to the first 8KB of the buffer for a NUL byte (`0x00`),
 * which is the same heuristic git uses to classify files as binary.
 *
 * @param buffer - Raw file bytes (only the leading portion is inspected)
 */
export function isLikelyBinary(buffer: Uint8Array): boolean {
  const limit = Math.min(buffer.length, 8192);
  for (let i = 0; i < limit; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

/**
 * Truncate a diff (or any multi-line string) to at most `maxLines` lines.
 * When the input is truncated, a `... (truncated)` marker line is appended.
 *
 * @param diff - The full diff text
 * @param maxLines - Maximum number of content lines to keep (clamped to >= 1)
 */
export function truncateDiffLines(diff: string, maxLines: number): string {
  if (!diff) {
    return '';
  }

  const safeMax = Math.max(1, Math.floor(maxLines));
  // Normalize CRLF so line counting is consistent across platforms.
  const lines = diff.replace(/\r\n/g, '\n').split('\n');

  // Drop a single trailing empty line produced by a final newline.
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  if (lines.length <= safeMax) {
    return lines.join('\n');
  }

  const kept = lines.slice(0, safeMax);
  kept.push('... (truncated)');
  return kept.join('\n');
}

/**
 * Build a `MarkdownString` tooltip from already-prepared content.
 *
 * The content is embedded in a fenced code block using the given language so
 * VS Code renders syntax highlighting (diff colouring for `'diff'`).
 *
 * @param content - The (already truncated) text to render
 * @param language - Fenced code-block language hint
 */
export function buildDiffTooltip(
  content: string,
  language: 'diff' | 'text' = 'diff'
): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  // We render our own fenced code block; do not treat content as trusted HTML.
  md.supportHtml = false;
  // Escape any fence sequence in the content so it cannot break out of the block.
  const safeContent = content.replace(/```/g, '`\u200b``');
  md.appendCodeblock(safeContent, language);
  return md;
}

/**
 * Build a plain-text informational tooltip (e.g. for binary files or when no
 * diff is available).
 */
export function buildMessageTooltip(message: string): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.appendText(message);
  return md;
}
