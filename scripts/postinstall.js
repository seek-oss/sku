#!/usr/bin/env node
const fs = require('fs');
const { setCwd, getPathFromCwd } = require('../lib/cwd');

// npm scripts can have an incorrect cwd
// in this case INIT_CWD should be set
// see: https://docs.npmjs.com/cli/run-script
// must be run first
setCwd(process.env.INIT_CWD);

const packageJson = getPathFromCwd('./package.json');
const packageJsonExists = fs.existsSync(packageJson);

// Don't run configure if CWD is not a project (e.g. npx)
if (packageJsonExists) {
  const { name: packageName, sku = true } = require(packageJson);

  // Don't run configure script on sku itself
  // Also ignore projects that are disabling sku core features through `sku: false`
  if (packageName !== 'sku' && sku) {
    const configure = require('../lib/configure');

    configure();
  }
}
