#!/usr/bin/env node
// @ts-check
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import debug from 'debug';
import chalk from 'chalk';

try {
  const initCwd = process.env.INIT_CWD;

  const localCwd = initCwd || process.cwd();
  const packageJson = join(localCwd, './package.json');
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
    console.log('sku postinstall script skipped');
    process.exit();
  }

  // Suppressing eslint. These imports will work after the build steps for postinstall.

  const { setCwd } = await import('../dist/lib/cwd.js');

  const banner = (await import('../dist/lib/banner.js')).default;

  const log = debug('sku:postinstall');

  // npm scripts can have an incorrect cwd
  // in this case INIT_CWD should be set
  // see: https://docs.npmjs.com/cli/run-script
  // must be run first
  if (initCwd) {
    setCwd(initCwd);
  }

  if (hasSkuDep) {
    banner('warning', 'sku dependency detected', [
      `${chalk.bold('sku')} is present as a ${chalk.bold('dependency')} in ${chalk.bold(
        packageJson,
      )}.`,
      `${chalk.bold('sku')} should be installed in ${chalk.bold('devDependencies')}.`,
    ]);
  }

  log('postinstall', 'configuring');
  let configure;
  try {
    log('postinstall', 'starting load of configure');
    configure = (await import('../src/utils/configureApp.js')).default;
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
} catch {
  console.log('package.json does not exist');
  process.exit();
}
