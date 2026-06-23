import * as path from 'path';
import { runTests } from '@vscode/test-electron';

/**
 * Entry point for the integration test suite. Downloads (and caches) a VS Code
 * build, then launches it with this extension loaded and the sample-repo
 * fixture opened as the workspace, running the Mocha suite inside the host.
 */
async function main(): Promise<void> {
  try {
    // The folder containing the extension manifest (package.json).
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The compiled Mocha entry point (suite/index.js).
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    // Workspace fixture to open inside the host.
    const fixtureWorkspace = path.resolve(__dirname, './fixtures/sample-repo');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      // Do NOT pass --disable-extensions: this extension depends on the
      // built-in `vscode.git` extension.
      launchArgs: [fixtureWorkspace],
    });
  } catch (err) {
    console.error('Failed to run integration tests:', err);
    process.exit(1);
  }
}

void main();
