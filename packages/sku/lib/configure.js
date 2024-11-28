const { rm } = require('node:fs/promises');
const path = require('node:path');

const dedent = require('dedent');
const chalk = require('chalk');

const ensureGitignore = require('ensure-gitignore');

const prettierConfig = require('../config/prettier/prettierConfig');
const createTSConfig = require('../config/typescript/tsconfig.js');
const {
  bundleReportFolder,
} = require('../config/webpack/plugins/bundleAnalyzer');
const { paths, httpsDevServer, languages } = require('../context');
const {
  shouldMigrateOldEslintConfig,
  migrateEslintignore,
  cleanUpOldEslintFiles,
  addEslintIgnoreToSkuConfig,
} = require('./eslintMigration');

const getCertificate = require('./certificate');
const { getPathFromCwd, writeFileToCWD } = require('./cwd');

const coverageFolder = 'coverage';

const convertToForwardSlashPaths = (pathStr) => pathStr.replace(/\\/g, '/');
const addSep = (p) => `${p}${path.sep}`;

module.exports = async () => {
  // Ignore target directories
  const webpackTargetDirectory = addSep(paths.relativeTarget);

  const gitIgnorePatterns = [
    // Ignore webpack bundle report output
    addSep(bundleReportFolder),
    addSep(coverageFolder),
    webpackTargetDirectory,
  ];

  // TODO: Remove this migration before releasing sku v15.
  const { shouldMigrate, eslintIgnoreExists } =
    await shouldMigrateOldEslintConfig();

  if (shouldMigrate) {
    console.log("'.eslintignore' file detected. Attempting migration...");

    if (eslintIgnoreExists) {
      const customIgnores = migrateEslintignore({
        hasLanguagesConfig: Boolean(languages && languages.length > 0),
        target: paths.relativeTarget,
      });

      if (customIgnores.length > 0) {
        try {
          await addEslintIgnoreToSkuConfig({
            skuConfigPath: paths.appSkuConfigPath,
            eslintIgnore: customIgnores,
          });
          console.log(
            "Successfully migrated '.eslintignore' file to 'eslintIgnore' property in sku config.",
          );
        } catch (e) {
          console.log("Failed to automatically migrate '.eslintignore' file");
          console.log('Error:', e.message, '\n');

          console.log('Please manually add the following to your sku config:');
          console.log(
            chalk.green('eslintIgnore:'),
            chalk.green(JSON.stringify(customIgnores, null, 2)),
          );
        }

        console.log(
          "Please note that this is a best-effort migration and you should manually review the 'eslintIgnore' property in your sku config.",
        );
      } else {
        console.log("No custom ignores found in '.eslintignore' file");
      }
    }

    console.log("Deleting '.eslintrc' and '.eslintignore' files...");
    await cleanUpOldEslintFiles();
    console.log("Successfully deleted '.eslintrc' and '.eslintignore' files.");
  }

  const eslintConfigFilename = 'eslint.config.js';
  const eslintCacheFilename = '.eslintcache';
  const eslintConfig = dedent`const { eslintConfigSku } = require('sku/config/eslint');

                              module.exports = eslintConfigSku;`;
  await writeFileToCWD(eslintConfigFilename, eslintConfig);

  gitIgnorePatterns.push(eslintConfigFilename, eslintCacheFilename);

  // Generate Prettier configuration
  // NOTE: We are not generating a banner as prettier does not support the `JSON
  // with comments` format in `.prettierrc`. We are opting for this filename as it
  // takes the highest precendence of the available config names and we want to
  // ensure it is not accidentally overridden by a non-controlled config file.
  const prettierConfigFilename = '.prettierrc';
  await writeFileToCWD(prettierConfigFilename, prettierConfig, {
    banner: false,
  });
  gitIgnorePatterns.push(prettierConfigFilename);

  // Generate TypeScript configuration
  const tsConfigFileName = 'tsconfig.json';
  await writeFileToCWD(tsConfigFileName, createTSConfig());
  gitIgnorePatterns.push(tsConfigFileName);

  const prettierIgnorePatterns = [...gitIgnorePatterns, 'pnpm-lock.yaml'];

  if (languages) {
    const generatedVocabFileGlob = '**/*.vocab/index.ts';
    gitIgnorePatterns.push(generatedVocabFileGlob);
    prettierIgnorePatterns.push(generatedVocabFileGlob);
  }

  // Write `.prettierignore`
  await ensureGitignore({
    filepath: getPathFromCwd('.prettierignore'),
    comment: 'managed by sku',
    patterns: prettierIgnorePatterns.map(convertToForwardSlashPaths),
  });

  // Generate self-signed certificate and ignore
  const selfSignedCertificateDirName = '.ssl';
  if (httpsDevServer) {
    await getCertificate(selfSignedCertificateDirName);
    gitIgnorePatterns.push(selfSignedCertificateDirName);
  } else {
    await rm(getPathFromCwd(selfSignedCertificateDirName), {
      recursive: true,
      force: true,
    });
  }

  // Write `.gitignore`
  await ensureGitignore({
    filepath: getPathFromCwd('.gitignore'),
    comment: 'managed by sku',
    patterns: gitIgnorePatterns.map(convertToForwardSlashPaths),
  });
};
