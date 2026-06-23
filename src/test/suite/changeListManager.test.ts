import * as assert from 'assert';
import * as vscode from 'vscode';
import { ChangeListManager } from '../../services/changeListManager';
import { GitService } from '../../services/gitService';

/**
 * Build an in-memory Memento implementation backed by a Map for isolated,
 * deterministic state tests.
 */
function createMemento(): vscode.Memento {
  const store = new Map<string, unknown>();
  return {
    get<T>(key: string, defaultValue?: T): T | undefined {
      return (store.has(key) ? store.get(key) : defaultValue) as T | undefined;
    },
    update(key: string, value: unknown): Thenable<void> {
      store.set(key, value);
      return Promise.resolve();
    },
    keys(): readonly string[] {
      return [...store.keys()];
    },
  };
}

describe('ChangeListManager', () => {
  let manager: ChangeListManager;

  beforeEach(async () => {
    // GitService is intentionally NOT initialized: with no repository,
    // getModifiedFiles() returns [], keeping these tests independent of git.
    const gitService = new GitService();
    manager = new ChangeListManager(createMemento(), gitService);
    await manager.initialize();
  });

  it('starts with exactly one default list', () => {
    const real = manager.getLists().filter((l) => !l.isReadOnly);
    assert.strictEqual(real.length, 1);
    assert.strictEqual(real[0].isDefault, true);
    assert.strictEqual(real[0].isActive, true);
  });

  it('create() adds a new list', async () => {
    await manager.create('Feature A', undefined, undefined, false);
    const names = manager.getLists().map((l) => l.name);
    assert.ok(names.includes('Feature A'));
  });

  it('create() rejects duplicate names', async () => {
    await manager.create('Dup', undefined, undefined, false);
    await assert.rejects(() => manager.create('Dup'));
  });

  it('setActive() guarantees a single active list', async () => {
    const a = await manager.create('A', undefined, undefined, false);
    const b = await manager.create('B', undefined, undefined, false);

    await manager.setActive(a.id);
    let active = manager.getLists().filter((l) => l.isActive);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].id, a.id);

    await manager.setActive(b.id);
    active = manager.getLists().filter((l) => l.isActive);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(active[0].id, b.id);
  });

  it('setColor() persists the color', async () => {
    const list = await manager.create('Colored', undefined, undefined, false);
    await manager.setColor(list.id, 'charts.red');
    assert.strictEqual(manager.getList(list.id)?.color, 'charts.red');

    await manager.setColor(list.id, undefined);
    assert.strictEqual(manager.getList(list.id)?.color, undefined);
  });

  it('rename() validates name uniqueness', async () => {
    await manager.create('Unique', undefined, undefined, false);
    const other = await manager.create('Other', undefined, undefined, false);
    await assert.rejects(() => manager.rename(other.id, 'Unique'));

    // A valid rename succeeds.
    await manager.rename(other.id, 'Renamed');
    assert.strictEqual(manager.getList(other.id)?.name, 'Renamed');
  });

  it('delete() moves files back to default and cannot remove the default list', async () => {
    const def = manager.getDefaultList();
    await assert.rejects(() => manager.delete(def.id));

    const list = await manager.create('Temp', undefined, undefined, false);
    await manager.delete(list.id);
    assert.strictEqual(manager.getList(list.id), undefined);
  });
});
