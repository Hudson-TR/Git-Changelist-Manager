import * as assert from 'assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'Hudson-TR.git-changelist-manager';

describe('Extension smoke tests', () => {
  it('is installed and discoverable', () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `Extension ${EXTENSION_ID} should be present`);
  });

  it('activates successfully', async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext);
    await ext!.activate();
    assert.strictEqual(ext!.isActive, true, 'Extension should be active after activate()');
  });

  it('registers core and new commands', async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext);
    await ext!.activate();

    const registered = await vscode.commands.getCommands(true);
    const expected = [
      'gitChangelistManager.createList',
      'gitChangelistManager.deleteList',
      'gitChangelistManager.renameList',
      'gitChangelistManager.setActiveList',
      'gitChangelistManager.moveToList',
      'gitChangelistManager.stageList',
      'gitChangelistManager.toggleViewMode',
      'gitChangelistManager.setListColor',
      'gitChangelistManager.filterChangelists',
      'gitChangelistManager.clearFilterChangelists',
      'gitChangelistManager.openFileDiff',
      'gitChangelistManager.refresh',
    ];

    for (const cmd of expected) {
      assert.ok(registered.includes(cmd), `Command not registered: ${cmd}`);
    }
  });
});
