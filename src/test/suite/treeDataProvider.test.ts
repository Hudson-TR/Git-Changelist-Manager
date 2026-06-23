import * as assert from 'assert';
import * as vscode from 'vscode';
import { ChangeListTreeDataProvider } from '../../providers/treeDataProvider';
import { ChangeListManager } from '../../services/changeListManager';
import { GitService } from '../../services/gitService';
import { ConfigService } from '../../services/configService';
import { DiffPreviewService } from '../../services/diffPreviewService';
import { FileNode, GitFileStatus } from '../../types';

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

function makeFileNode(listId: string): FileNode {
  return {
    type: 'file',
    id: '/repo/README.md',
    label: 'README.md',
    change: {
      resourceUri: vscode.Uri.file('/repo/README.md'),
      relativePath: 'README.md',
      changeListId: listId,
      gitStatus: GitFileStatus.Modified,
    },
  };
}

describe('TreeDataProvider file items (inline preview + diff click)', () => {
  let manager: ChangeListManager;
  let git: GitService;
  let config: ConfigService;

  beforeEach(async () => {
    git = new GitService();
    manager = new ChangeListManager(createMemento(), git);
    await manager.initialize();
    config = new ConfigService();
  });

  it('leaves tooltip undefined so resolveTreeItem can build the preview', () => {
    const provider = new ChangeListTreeDataProvider(manager, git, config);
    const node = makeFileNode(manager.getDefaultList().id);

    const item = provider.getTreeItem(node);

    assert.strictEqual(
      item.tooltip,
      undefined,
      'file item tooltip must be undefined so VS Code calls resolveTreeItem'
    );
  });

  it('routes file click to the openFileDiff command', () => {
    const provider = new ChangeListTreeDataProvider(manager, git, config);
    const node = makeFileNode(manager.getDefaultList().id);

    const item = provider.getTreeItem(node);

    assert.ok(item.command, 'file item should have a command');
    assert.strictEqual(item.command!.command, 'gitChangelistManager.openFileDiff');
    assert.deepStrictEqual(item.command!.arguments, [node]);
  });

  it('resolveTreeItem attaches the diff preview tooltip', async () => {
    // Fake preview service returning a known MarkdownString.
    const fakePreview = {
      getTooltip: async () => new vscode.MarkdownString('```diff\n+added line\n```'),
      clearCache: () => undefined,
      dispose: () => undefined,
    } as unknown as DiffPreviewService;

    const provider = new ChangeListTreeDataProvider(manager, git, config, fakePreview);
    const node = makeFileNode(manager.getDefaultList().id);

    const item = provider.getTreeItem(node);
    const token = new vscode.CancellationTokenSource().token;
    const resolved = await provider.resolveTreeItem!(item, node, token);

    assert.ok(resolved.tooltip instanceof vscode.MarkdownString, 'tooltip should be a MarkdownString');
    assert.ok(
      (resolved.tooltip as vscode.MarkdownString).value.includes('+added line'),
      'tooltip should contain the diff content'
    );
  });
});
