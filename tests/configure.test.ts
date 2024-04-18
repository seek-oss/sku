import { readFile, copyFile, mkdir as makeDir } from 'node:fs/promises';
import { rimraf } from 'rimraf';
import path from 'node:path';
import * as jsonc from 'jsonc-parser';
import { runSkuScriptInDir } from '@sku-private/test-utils';

import { bundleReportFolder } from '../packages/sku/config/webpack/plugins/bundleAnalyzer';
import prettierConfig from '../packages/sku/config/prettier/prettierConfig';
import skuConfig from '@sku-fixtures/configure/sku.config';

const defaultTargetDir = 'dist';
const defaultStorybookTargetDir = 'dist-storybook';
const coverageFolder = 'coverage';
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
  rimraf(folder, {
    glob: {
      dot: true,
    },
  });

const skuPackagePath = path.dirname(require.resolve('sku/package.json'));

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

    it('should generate a eslint config', async () => {
      const eslintrc = await readJsonC(appFolder, '.eslintrc');
      expect(eslintrc.extends).toEqual(
        require.resolve('eslint-config-seek', {
          // Explicitly resolve from sku's node_modules so we don't pick up the monorepo's eslint-config-seek
          paths: [skuPackagePath],
        }),
      );
    });

    it(`should generate \`.gitignore\``, async () => {
      const ignoreContents = await readIgnore(appFolder, '.gitignore');
      expect(ignoreContents.length).toEqual(9);
      expect(ignoreContents).toContain(`.eslintrc`);
      expect(ignoreContents).toContain(`.eslintcache`);
      expect(ignoreContents).toContain(`.prettierrc`);
      expect(ignoreContents).toContain(`.storybook/main.js`);
      expect(ignoreContents).toContain(`${defaultTargetDir}/`);
      expect(ignoreContents).toContain(`${defaultStorybookTargetDir}/`);
      expect(ignoreContents).toContain(`${bundleReportFolder}/`);
      expect(ignoreContents).toContain(`${coverageFolder}/`);
      expect(ignoreContents).toContain('tsconfig.json');
    });

    ['.eslintignore', '.prettierignore'].forEach((ignore) =>
      it(`should generate \`${ignore}\``, async () => {
        const ignoreContents = await readIgnore(appFolder, ignore);
        expect(ignoreContents.length).toEqual(6);
        expect(ignoreContents).toContain('*.less.d.ts');
        expect(ignoreContents).toContain(`.storybook/main.js`);
        expect(ignoreContents).toContain(`${defaultTargetDir}/`);
        expect(ignoreContents).toContain(`${bundleReportFolder}/`);
        expect(ignoreContents).toContain(`${coverageFolder}/`);
        expect(ignoreContents).toContain(`${defaultStorybookTargetDir}/`);
      }),
    );
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

    it('should generate a custom prettier config', async () => {
      const prettierRc = await readJsonC(appFolderTS, '.prettierrc');
      expect(prettierRc).not.toEqual(prettierConfig);
      expect(prettierRc).toEqual({ ...prettierConfig, semi: false });
    });

    it('should generate a custom eslint config', async () => {
      const eslintrc = await readJsonC(appFolderTS, '.eslintrc');
      expect(eslintrc.extends).toEqual(
        require.resolve('eslint-config-seek', {
          // Explicitly resolve from sku's node_modules so we don't pick up the monorepo's eslint-config-seek
          paths: [skuPackagePath],
        }),
      );
      expect(eslintrc.rules['no-console']).toEqual(0);
    });

    it('should generate tsconfig config', async () => {
      const tsconfigContents = await readJsonC(appFolderTS, 'tsconfig.json');
      expect(Object.keys(tsconfigContents).sort()).toEqual(['compilerOptions']);
    });

    it(`should generate \`.gitignore\``, async () => {
      const ignoreContents = await readIgnore(appFolderTS, '.gitignore');
      expect(ignoreContents.length).toEqual(9);
      expect(ignoreContents).toContain(`.eslintrc`);
      expect(ignoreContents).toContain(`.eslintcache`);
      expect(ignoreContents).toContain(`.prettierrc`);
      expect(ignoreContents).toContain(`tsconfig.json`);
      expect(ignoreContents).toContain(`.storybook/main.js`);
      expect(ignoreContents).toContain(`${skuConfig.target}/`);
      expect(ignoreContents).toContain(`${skuConfig.storybookTarget}/`);
      expect(ignoreContents).toContain(`${bundleReportFolder}/`);
      expect(ignoreContents).toContain(`${coverageFolder}/`);
    });

    ['.eslintignore', '.prettierignore'].forEach((ignore) =>
      it(`should generate \`${ignore}\``, async () => {
        const ignoreContents = await readIgnore(appFolderTS, ignore);
        expect(ignoreContents.length).toEqual(6);
        expect(ignoreContents).toContain('*.less.d.ts');
        expect(ignoreContents).toContain(`.storybook/main.js`);
        expect(ignoreContents).toContain(`${skuConfig.target}/`);
        expect(ignoreContents).toContain(`${skuConfig.storybookTarget}/`);
        expect(ignoreContents).toContain(`${bundleReportFolder}/`);
        expect(ignoreContents).toContain(`${coverageFolder}/`);
      }),
    );
  });
});
