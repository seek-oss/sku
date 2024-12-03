#!/usr/bin/env node
// @ts-check
import { readFile } from 'node:fs/promises';
import { setCwd, getPathFromCwd, cwd } from '../lib/cwd.js';
import debug from 'debug';
import banner from '../lib/banner.js';
import { bold } from 'chalk';
import exists from '../lib/exists.js';

const log = debug('sku:postinstall');

// npm scripts can have an incorrect cwd
// in this case INIT_CWD should be set
// see: https://docs.npmjs.com/cli/run-script
// must be run first
const initCwd = process.env.INIT_CWD;
if (initCwd) {
  setCwd(initCwd);
}

log('postinstall', `changed cwd to ${cwd()}`);

const packageJson = getPathFromCwd('./package.json');
const packageJsonExists = await exists(packageJson);

// Don't run configure if CWD is not a project (e.g. npx)
if (packageJsonExists) {
  log('postinstall', 'packageJsonExists');
  const packageJsonContents = await readFile(packageJson, 'utf-8');
  const {
    name: packageName,
    dependencies,
    devDependencies,
    skuSkipPostInstall = false,
    skuSkipPostinstall = false,
  } = JSON.parse(packageJsonContents);

  const skipPostInstall = skuSkipPostInstall || skuSkipPostinstall;
  const hasSkuDep = Boolean(dependencies?.sku);
  // sku should always be a dev dependency now that sku init installs it as one, but some repos may still have it as a regular dependency
  const hasSku = Boolean(devDependencies?.sku) || hasSkuDep;
  // Don't run configure script on sku itself
  // Don't run configure script if sku is not installed
  // Ignore projects that are opting out of sku's postinstall script
  if (packageName === 'sku' || !hasSku || skipPostInstall) {
    process.exit();
  }

  if (hasSkuDep) {
    banner('warning', 'sku dependency detected', [
      `${bold('sku')} is present as a ${bold('dependency')} in ${bold(
        packageJson,
      )}.`,
      `${bold('sku')} should be installed in ${bold('devDependencies')}.`,
    ]);
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
