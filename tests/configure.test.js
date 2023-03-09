const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const copyFile = promisify(fs.copyFile);
const makeDir = promisify(fs.mkdir);
const rimraf = promisify(require('rimraf'));
const path = require('path');
const jsonc = require('jsonc-parser');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const {
  bundleReportFolder,
} = require('../config/webpack/plugins/bundleAnalyzer');
const prettierConfig = require('../config/prettier/prettierConfig');
const defaultTargetDir = 'dist';
const defaultStorybookTargetDir = 'dist-storybook';
const coverageFolder = 'coverage';
const skuConfig = require('@fixtures/configure/sku.config.js');
const fixtureFolder = path.dirname(
  require.resolve('@fixtures/configure/sku.config.js'),
);
const appFolder = path.resolve(fixtureFolder, 'App');
const appFolderTS = path.resolve(fixtureFolder, 'TSApp');

const readFileContents = async (appDir, fileName) => {
  const contents = await readFile(path.join(appDir, fileName), 'utf-8');
  return contents;
};

const readJsonC = async (appDir, fileName) => {
  const contents = await readFileContents(appDir, fileName);
  return jsonc.parse(contents);
};

const readIgnore = async (appDir, fileName) => {
  const contents = await readFileContents(appDir, fileName);
  return contents
    .split('\n')
    .filter((ignore) => ignore && !ignore.startsWith('#')); // remove blanks and comments
};

const copyToApp = async (filename, folder) =>
  copyFile(path.join(fixtureFolder, filename), path.join(folder, filename));

const removeAppDir = async (folder) =>
  rimraf(folder, {
    glob: {
      dot: true,
    },
  });

describe('configure', () => {
  describe('default', () => {
    beforeAll(async () => {
      await makeDir(appFolder);
      await copyToApp('App.js', appFolder);
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
      expect(eslintrc.extends).toEqual(require.resolve('eslint-config-seek'));
    });

    it(`should generate \`.gitignore\``, async () => {
      const ignoreContents = await readIgnore(appFolder, '.gitignore');
      expect(ignoreContents.length).toEqual(7);
      expect(ignoreContents).toContain(`.eslintrc`);
      expect(ignoreContents).toContain(`.prettierrc`);
      expect(ignoreContents).toContain(`${defaultTargetDir}/`);
      expect(ignoreContents).toContain(`${defaultStorybookTargetDir}/`);
      expect(ignoreContents).toContain(`${bundleReportFolder}/`);
      expect(ignoreContents).toContain(`${coverageFolder}/`);
      expect(ignoreContents).toContain('tsconfig.json');
    });

    ['.eslintignore', '.prettierignore'].forEach((ignore) =>
      it(`should generate \`${ignore}\``, async () => {
        const ignoreContents = await readIgnore(appFolder, ignore);
        expect(ignoreContents.length).toEqual(5);
        expect(ignoreContents).toContain('*.less.d.ts');
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
      await copyToApp('App.tsx', appFolderTS);
      await copyToApp('sku.config.js', appFolderTS);
      await runSkuScriptInDir('configure', appFolderTS);
    });

    afterAll(async () => {
      await removeAppDir(appFolderTS);
    });

    it('should generate a prettier config', async () => {
      const prettierRc = await readJsonC(appFolderTS, '.prettierrc');
      expect(prettierRc).toEqual(prettierConfig);
    });

    it('should generate a custom eslint config', async () => {
      const eslintrc = await readJsonC(appFolderTS, '.eslintrc');
      expect(eslintrc.extends).toEqual(require.resolve('eslint-config-seek'));
      expect(eslintrc.rules['no-console']).toEqual(0);
    });

    it('should generate tsconfig config', async () => {
      const tsconfigContents = await readJsonC(appFolderTS, 'tsconfig.json');
      expect(Object.keys(tsconfigContents).sort()).toEqual([
        'compilerOptions',
        'include',
      ]);
    });

    it(`should generate \`.gitignore\``, async () => {
      const ignoreContents = await readIgnore(appFolderTS, '.gitignore');
      expect(ignoreContents.length).toEqual(7);
      expect(ignoreContents).toContain(`.eslintrc`);
      expect(ignoreContents).toContain(`.prettierrc`);
      expect(ignoreContents).toContain(`tsconfig.json`);
      expect(ignoreContents).toContain(`${skuConfig.target}/`);
      expect(ignoreContents).toContain(`${skuConfig.storybookTarget}/`);
      expect(ignoreContents).toContain(`${bundleReportFolder}/`);
      expect(ignoreContents).toContain(`${coverageFolder}/`);
    });

    ['.eslintignore', '.prettierignore'].forEach((ignore) =>
      it(`should generate \`${ignore}\``, async () => {
        const ignoreContents = await readIgnore(appFolderTS, ignore);
        expect(ignoreContents.length).toEqual(5);
        expect(ignoreContents).toContain('*.less.d.ts');
        expect(ignoreContents).toContain(`${skuConfig.target}/`);
        expect(ignoreContents).toContain(`${skuConfig.storybookTarget}/`);
        expect(ignoreContents).toContain(`${bundleReportFolder}/`);
        expect(ignoreContents).toContain(`${coverageFolder}/`);
      }),
    );
  });
});
