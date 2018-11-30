#!/usr/bin/env node
const { setCwd, getPathFromCwd } = require('../lib/cwd');

// npm scripts can have an incorrect cwd
// in this case INIT_CWD should be set
// see: https://docs.npmjs.com/cli/run-script
// must be run first
setCwd(process.env.INIT_CWD);

const packageName = require(getPathFromCwd('./package.json')).name;

// Don't run configure script on sku itself
if (packageName !== 'sku') {
  const configure = require('../lib/configure');

  configure();
}
