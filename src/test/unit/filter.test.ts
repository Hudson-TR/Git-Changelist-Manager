import * as assert from 'assert';
import { matchesChangelistFilter } from '../../utils/helpers';

describe('matchesChangelistFilter', () => {
  const rel = 'src/services/gitService.ts';
  const name = 'gitService.ts';

  it('matches everything for an empty or whitespace query', () => {
    assert.strictEqual(matchesChangelistFilter(rel, name, ''), true);
    assert.strictEqual(matchesChangelistFilter(rel, name, '   '), true);
  });

  it('matches on a partial file name', () => {
    assert.strictEqual(matchesChangelistFilter(rel, name, 'git'), true);
    assert.strictEqual(matchesChangelistFilter(rel, name, 'service'), true);
  });

  it('matches on a path segment not present in the file name', () => {
    assert.strictEqual(matchesChangelistFilter(rel, name, 'services'), true);
  });

  it('is case-insensitive', () => {
    assert.strictEqual(matchesChangelistFilter(rel, name, 'GITSERVICE'), true);
    assert.strictEqual(matchesChangelistFilter(rel, name, 'SeRvIcEs'), true);
  });

  it('requires ALL space-separated terms to match (AND semantics)', () => {
    // both terms present (one in path, one in name)
    assert.strictEqual(matchesChangelistFilter(rel, name, 'services git'), true);
    // second term absent
    assert.strictEqual(matchesChangelistFilter(rel, name, 'git nomatch'), false);
  });

  it('returns false when no term matches', () => {
    assert.strictEqual(matchesChangelistFilter(rel, name, 'controller'), false);
  });

  it('ignores extra whitespace between terms', () => {
    assert.strictEqual(matchesChangelistFilter(rel, name, '  git   service  '), true);
  });
});
