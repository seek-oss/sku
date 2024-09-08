import { readFile, copyFile, mkdir as makeDir, rm } from 'node:fs/promises';
import path from 'node:path';

import { runSkuScriptInDir } from '@sku-private/test-utils';
import * as jsonc from 'jsonc-parser';

import prettierConfig from '../packages/sku/config/prettier/prettierConfig';

const fixtureFolder = path.dirname(
  require.resolve('@sku-fixtures/configure/sku.config.ts'),
);
const appFolder = path.resolve(fixtureFolder, 'App');
const appFolderTS = path.resolve(fixtureFolder, 'TSApp');

const readFileContents = async (appDir: string, fileName: string) => {
  const contents = await readFile(path.join(appDir, fileName), 'utf-8');
  return contents;
};

const readJsonC = async (appDir: string, fileName: string) => {
  const contents = await readFileContents(appDir, fileName);
  return jsonc.parse(contents);
};

const readIgnore = async (appDir: string, fileName: string) => {
  const contents = await readFileContents(appDir, fileName);
  return contents
    .split('\n')
    .filter((ignore) => ignore && !ignore.startsWith('#')); // remove blanks and comments
};

const copyToApp = async (filename: string, folder: string) =>
  copyFile(path.join(fixtureFolder, filename), path.join(folder, filename));

const removeAppDir = async (folder: string) =>
  rm(folder, {
    recursive: true,
    force: true,
  });

describe('configure', () => {
  describe('default', () => {
    beforeAll(async () => {
      await makeDir(appFolder);
      await makeDir(path.join(appFolder, './src'));
      await copyToApp('src/App.js', appFolder);
      await copyToApp('package.json', appFolder);
      await runSkuScriptInDir('configure', appFolder);
    });

    afterAll(async () => {
      await removeAppDir(appFolder);
    });

    it('should generate a prettier config', async () => {
      const prettierRc = await readJsonC(appFolder, '.prettierrc');

      expect(prettierRc).toEqual(prettierConfig);
    });

    it.todo('should generate a eslint config');

    it(`should generate \`.gitignore\``, async () => {
      const ignoreContents = await readIgnore(appFolder, '.gitignore');

      expect(ignoreContents).toMatchInlineSnapshot(`
        [
          ".eslintcache",
          ".prettierrc",
          "coverage/",
          "dist/",
          "eslint.config.js",
          "report/",
          "tsconfig.json",
        ]
      `);
    });

    it('should generate .prettierignore', async () => {
      const ignoreContents = await readIgnore(appFolder, '.prettierignore');

      expect(ignoreContents).toMatchSnapshot();
    });
  });

  describe('custom', () => {
    beforeAll(async () => {
      await makeDir(appFolderTS);
      await makeDir(path.join(appFolderTS, './src'));
      await copyToApp('src/App.tsx', appFolderTS);
      await copyToApp('package.json', appFolderTS);
      await copyToApp('sku.config.ts', appFolderTS);
      await runSkuScriptInDir('configure', appFolderTS);
    });

    afterAll(async () => {
      await removeAppDir(appFolderTS);
    });

    it('should generate a prettier config', async () => {
      const prettierRc = await readJsonC(appFolderTS, '.prettierrc');

      expect(prettierRc).toEqual(prettierConfig);
    });

    it.todo('should generate a custom eslint config');

    it('should generate tsconfig config', async () => {
      const tsconfigContents = await readJsonC(appFolderTS, 'tsconfig.json');

      expect(Object.keys(tsconfigContents).sort()).toEqual(['compilerOptions']);
    });

    it(`should generate \`.gitignore\``, async () => {
      const ignoreContents = await readIgnore(appFolderTS, '.gitignore');

      expect(ignoreContents).toMatchInlineSnapshot(`
        [
          ".eslintcache",
          ".prettierrc",
          "coverage/",
          "eslint.config.js",
          "foo/bar/",
          "report/",
          "tsconfig.json",
        ]
      `);
    });

    it('should generate .prettierignore', async () => {
      const ignoreContents = await readIgnore(appFolderTS, '.prettierignore');

      expect(ignoreContents).toMatchSnapshot();
    });
  });
});
