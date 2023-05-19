#!/usr/bin/env node
const fs = require('fs');
const { setCwd, getPathFromCwd, cwd } = require('../lib/cwd');
const debug = require('debug');

const log = debug('sku:postinstall');

// npm scripts can have an incorrect cwd
// in this case INIT_CWD should be set
// see: https://docs.npmjs.com/cli/run-script
// must be run first
setCwd(process.env.INIT_CWD);

log('postinstall', `changed cwd to ${cwd()}`);

const packageJson = getPathFromCwd('./package.json');
const packageJsonExists = fs.existsSync(packageJson);

// Don't run configure if CWD is not a project (e.g. npx)
if (packageJsonExists) {
  log('postinstall', 'packageJsonExists');
  const {
    name: packageName,
    dependencies,
    devDependencies,
    skuSkipPostInstall = false,
    skuSkipPostinstall = false,
  } = require(packageJson);

  const skipPostInstall = skuSkipPostInstall || skuSkipPostinstall;
  const hasSku =
    Boolean(devDependencies?.sku) ||
    // TODO: get rid of this part when we remove treat
    Boolean(dependencies?.sku);

  // Don't run configure script on sku itself
  // Don't run configure script if sku is not installed
  // Ignore projects that are opting out of sku's postinstall script
  if (packageName === 'sku' || !hasSku || skipPostInstall) {
    process.exit();
  }

  log('postinstall', 'configuring');
  let configure;
  try {
    log('postinstall', 'starting load of configure');
    log('postinstall', require.resolve('../lib/configure'));
    configure = require('../lib/configure');
  } catch (error) {
    console.error(
      'An error occurred loading configure script. Please check that sku.config.js is correct and try again.',
    );
    console.error(error);
    throw error;
  }
  log('postinstall', 'loaded configure');

  try {
    log('postinstall', 'running configure');
    configure();
    log('postinstall', 'successfully configured');
  } catch (error) {
    console.error(
      'An error occurred running postinstall script. Please check that sku.config.js is correct and try again.',
    );
    console.error(error);
    throw error;
  }
}
