#!/usr/bin/env node
/**
 * Package once and publish the same VSIX to VS Code Marketplace and Open VSX.
 *
 * Auth (set before running):
 *   VSCE_PAT  — Azure DevOps PAT with Marketplace (Publish) scope
 *   OVSX_PAT  — Open VSX access token from https://open-vsx.org/user-settings/tokens
 *
 * Usage:
 *   pnpm run publish           # both marketplaces
 *   pnpm run publish:vsce      # VS Code Marketplace only
 *   pnpm run publish:ovsx      # Open VSX only
 *
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const vsix = `${pkg.name}-${pkg.version}.vsix`;
const vsixPath = join(root, vsix);

const targets = new Set(process.argv.slice(2));
const publishAll = targets.size === 0;
const publishVsce = publishAll || targets.has('vsce');
const publishOvsx = publishAll || targets.has('ovsx');

if (!publishVsce && !publishOvsx) {
  console.error('Unknown target. Use: vsce, ovsx, or omit for both.');
  process.exit(1);
}

function run(command, label) {
  console.log(`\n==> ${label}`);
  execSync(command, { cwd: root, stdio: 'inherit', env: process.env });
}

if (publishVsce && !process.env.VSCE_PAT) {
  console.warn(
    'Warning: VSCE_PAT is not set. vsce will use credentials from `pnpm exec vsce login <publisher>` if available.'
  );
}

if (publishOvsx && !process.env.OVSX_PAT) {
  console.error('Error: OVSX_PAT is required for Open VSX. Generate one at https://open-vsx.org/user-settings/tokens');
  process.exit(1);
}

run('pnpm run package', 'Packaging VSIX');

if (!existsSync(vsixPath)) {
  console.error(`Error: expected ${vsix} after packaging.`);
  process.exit(1);
}

if (publishVsce) {
  run(`pnpm exec vsce publish ${vsix} --no-dependencies`, 'Publishing to VS Code Marketplace');
}

if (publishOvsx) {
  run(`pnpm exec ovsx publish ${vsix}`, 'Publishing to Open VSX');
}

console.log('\nPublish complete.');
if (publishVsce) {
  console.log(`  VS Code: https://marketplace.visualstudio.com/items?itemName=${pkg.publisher}.${pkg.name}`);
}
if (publishOvsx) {
  console.log(`  Open VSX: https://open-vsx.org/extension/${pkg.publisher}/${pkg.name}`);
}
