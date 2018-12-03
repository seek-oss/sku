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
  const packageName = require(packageJson).name;

  // Don't run configure script on sku itself
  if (packageName !== 'sku') {
    const configure = require('../lib/configure');

    configure();
  }
}
