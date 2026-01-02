#!/usr/bin/env node
/**
 * Postinstall script to remove node-gyp from bigint-buffer-fixed dependencies.
 * 
 * bigint-buffer-fixed declares node-gyp as a production dependency, which pulls
 * in build tools unnecessarily. Since this is a frontend Vite app, native modules
 * won't be bundled anyway, so node-gyp is not needed.
 * 
 * This script:
 * 1. Removes node-gyp from bigint-buffer-fixed's package.json
 * 2. Removes the node-gyp directory from node_modules
 * 
 * This prevents node-gyp and its transitive dependencies from bloating the
 * node_modules directory.
 */

const fs = require('fs');
const path = require('path');

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    } catch (error) {
      console.warn(`Failed to remove ${dirPath}:`, error.message);
      return false;
    }
  }
  return false;
}

const rootDir = path.join(__dirname, '..');
const pkgPath = path.join(rootDir, 'node_modules', 'bigint-buffer-fixed', 'package.json');
const nodeGypPath = path.join(rootDir, 'node_modules', 'node-gyp');

if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let modified = false;

    // Remove node-gyp from dependencies
    if (pkg.dependencies && pkg.dependencies['node-gyp']) {
      delete pkg.dependencies['node-gyp'];
      modified = true;
    }

    // Remove node-gyp from optionalDependencies if present
    if (pkg.optionalDependencies && pkg.optionalDependencies['node-gyp']) {
      delete pkg.optionalDependencies['node-gyp'];
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('Removed node-gyp from bigint-buffer-fixed dependencies');
    }
  } catch (error) {
    console.warn('Failed to remove node-gyp from bigint-buffer-fixed:', error.message);
  }
}

// Remove node-gyp directory if it exists and is only used by bigint-buffer-fixed
// (We check if it's in bigint-buffer-fixed's node_modules to be safe)
const bigintBufferNodeGypPath = path.join(
  rootDir,
  'node_modules',
  'bigint-buffer-fixed',
  'node_modules',
  'node-gyp'
);

if (removeDir(bigintBufferNodeGypPath)) {
  console.log('Removed node-gyp from bigint-buffer-fixed node_modules');
}

// Also remove from root node_modules if it's only there because of bigint-buffer-fixed
// (This is a best-effort cleanup - npm might have hoisted it)
if (fs.existsSync(nodeGypPath)) {
  // Check if node-gyp is only used by bigint-buffer-fixed by checking package.json
  try {
    const nodeGypPkg = JSON.parse(fs.readFileSync(path.join(nodeGypPath, 'package.json'), 'utf8'));
    // Only remove if we're confident it's safe (this is conservative)
    // In practice, we'll let npm handle hoisting and just remove from bigint-buffer-fixed
  } catch (error) {
    // Ignore errors checking node-gyp package
  }
}

