import * as assert from 'assert';
import {
  truncateDiffLines,
  isLikelyBinary,
  hasBinaryExtension,
  buildDiffTooltip,
} from '../../utils/diffPreview';

describe('diffPreview', () => {
  describe('truncateDiffLines', () => {
    it('returns empty string for empty input', () => {
      assert.strictEqual(truncateDiffLines('', 20), '');
    });

    it('keeps content under the limit unchanged', () => {
      const diff = 'line1\nline2\nline3';
      assert.strictEqual(truncateDiffLines(diff, 20), 'line1\nline2\nline3');
    });

    it('truncates to N lines and appends a marker', () => {
      const diff = ['a', 'b', 'c', 'd', 'e'].join('\n');
      const result = truncateDiffLines(diff, 3);
      const lines = result.split('\n');
      assert.strictEqual(lines.length, 4); // 3 content + marker
      assert.deepStrictEqual(lines.slice(0, 3), ['a', 'b', 'c']);
      assert.strictEqual(lines[3], '... (truncated)');
    });

    it('normalizes CRLF and drops a single trailing newline', () => {
      const diff = 'a\r\nb\r\n';
      assert.strictEqual(truncateDiffLines(diff, 20), 'a\nb');
    });

    it('clamps a non-positive maxLines to at least 1', () => {
      const result = truncateDiffLines('a\nb\nc', 0);
      const lines = result.split('\n');
      assert.strictEqual(lines[0], 'a');
      assert.strictEqual(lines[lines.length - 1], '... (truncated)');
    });
  });

  describe('isLikelyBinary', () => {
    it('detects a NUL byte as binary', () => {
      const buf = new Uint8Array([0x68, 0x69, 0x00, 0x21]);
      assert.strictEqual(isLikelyBinary(buf), true);
    });

    it('treats plain UTF-8 text as non-binary', () => {
      const buf = new TextEncoder().encode('hello world\nsecond line');
      assert.strictEqual(isLikelyBinary(buf), false);
    });

    it('treats empty buffers as non-binary', () => {
      assert.strictEqual(isLikelyBinary(new Uint8Array([])), false);
    });
  });

  describe('hasBinaryExtension', () => {
    it('recognizes common binary extensions (case-insensitive)', () => {
      assert.strictEqual(hasBinaryExtension('static/icon.PNG'), true);
      assert.strictEqual(hasBinaryExtension('build/app.exe'), true);
      assert.strictEqual(hasBinaryExtension('fonts/roboto.woff2'), true);
    });

    it('treats source files as non-binary', () => {
      assert.strictEqual(hasBinaryExtension('src/utils/helpers.ts'), false);
      assert.strictEqual(hasBinaryExtension('README'), false);
    });
  });

  describe('buildDiffTooltip', () => {
    it('wraps content in a fenced diff code block', () => {
      const md = buildDiffTooltip('+added\n-removed', 'diff');
      assert.ok(md.value.includes('```diff'));
      assert.ok(md.value.includes('+added'));
      assert.ok(md.value.includes('-removed'));
    });

    it('neutralizes embedded fences so they cannot break out', () => {
      const md = buildDiffTooltip('before```after', 'diff');
      assert.ok(!md.value.includes('before```after'));
    });
  });
});
