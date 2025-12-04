#!/usr/bin/env node
// @ts-nocheck
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

try {
  const initCwd = process.env.INIT_CWD;
  const localCwd = initCwd || process.cwd();

  const packageJson = join(localCwd, './package.json');
  let packageJsonContents;

  try {
    packageJsonContents = await readFile(packageJson, 'utf-8');
  } catch {
    console.log(
      `package.json file does not exist at ${packageJson}. Skipping sku postinstall.`,
    );
    process.exit(0);
  }

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

  // Ignore eslint. These imports will work after the build steps for postinstall.
  const { postinstall } = await import('../dist/postinstall.mjs');
  await postinstall({ localCwd, packageJson, hasSkuDep });
} catch (error) {
  console.error('An unknown error occurred');
  console.error(error);
  process.exit(1);
}
