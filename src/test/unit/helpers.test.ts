import * as assert from 'assert';
import {
  sortChangeLists,
  normalizePath,
  getFileName,
  formatFileCount,
  truncateLabel,
} from '../../utils/helpers';

describe('helpers', () => {
  describe('sortChangeLists', () => {
    it('orders default first, active second, then alphabetically', () => {
      const lists = [
        { name: 'Zeta', isDefault: false, isActive: false },
        { name: 'Active One', isDefault: false, isActive: true },
        { name: 'Default', isDefault: true, isActive: false },
        { name: 'Alpha', isDefault: false, isActive: false },
      ];

      const sorted = sortChangeLists(lists).map((l) => l.name);
      assert.deepStrictEqual(sorted, ['Default', 'Active One', 'Alpha', 'Zeta']);
    });

    it('keeps default ahead of an active non-default list', () => {
      const lists = [
        { name: 'Feature', isDefault: false, isActive: true },
        { name: 'Default', isDefault: true, isActive: false },
      ];
      const sorted = sortChangeLists(lists).map((l) => l.name);
      assert.deepStrictEqual(sorted, ['Default', 'Feature']);
    });
  });

  describe('normalizePath', () => {
    it('converts backslashes to forward slashes', () => {
      assert.strictEqual(normalizePath('src\\utils\\helpers.ts'), 'src/utils/helpers.ts');
    });

    it('leaves forward-slash paths unchanged', () => {
      assert.strictEqual(normalizePath('src/utils/helpers.ts'), 'src/utils/helpers.ts');
    });
  });

  describe('getFileName', () => {
    it('returns the last path segment', () => {
      assert.strictEqual(getFileName('src/utils/helpers.ts'), 'helpers.ts');
      assert.strictEqual(getFileName('src\\utils\\helpers.ts'), 'helpers.ts');
      assert.strictEqual(getFileName('README.md'), 'README.md');
    });
  });

  describe('formatFileCount', () => {
    it('formats zero, one and many', () => {
      assert.strictEqual(formatFileCount(0), 'empty');
      assert.strictEqual(formatFileCount(1), '1 file');
      assert.strictEqual(formatFileCount(5), '5 files');
    });
  });

  describe('truncateLabel', () => {
    it('returns short labels unchanged', () => {
      assert.strictEqual(truncateLabel('Default', 16), 'Default');
      assert.strictEqual(truncateLabel('Sixteen chars!!!', 16), 'Sixteen chars!!!');
    });

    it('truncates long labels with an ellipsis at maxLength', () => {
      const result = truncateLabel('Feature: User Authentication', 16);
      assert.strictEqual(result.length, 16);
      assert.ok(result.endsWith('…'));
      assert.strictEqual(result, 'Feature: User A…');
    });

    it('handles degenerate max lengths', () => {
      assert.strictEqual(truncateLabel('anything', 0), '');
      assert.strictEqual(truncateLabel('anything', 1), '…');
    });
  });
});
