/**
 * Mocha setup for unit tests. Installs a module-resolution hook so that any
 * `require('vscode')` performed by the modules under test resolves to our
 * lightweight mock instead of failing (the real `vscode` module only exists
 * inside the extension host).
 *
 * Loaded via `mocha --require out/test/unit/setup.js`.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Module = require('module');
const originalLoad = Module._load;

Module._load = function load(request: string, ...rest: unknown[]): unknown {
  if (request === 'vscode') {
    // Resolve the compiled mock sitting next to this file.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./vscode-mock');
  }
  return originalLoad.call(Module, request, ...rest);
};
