const { rm } = require('node:fs/promises');
const path = require('node:path');

const debug = require('debug');
const log = debug('sku:configure');
const dedent = require('dedent');

const ensureGitignore = require('ensure-gitignore');

const prettierConfig = require('../config/prettier/prettierConfig');
const createTSConfig = require('../config/typescript/tsconfig.js');
const {
  bundleReportFolder,
} = require('../config/webpack/plugins/bundleAnalyzer');
const { paths, httpsDevServer, languages } = require('../context');
const {
  shouldMigrateEslintIgnore,
  migrateEslintignore,
  cleanUpOldEslintFiles,
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
  if (await shouldMigrateEslintIgnore()) {
    log('Old eslint config or ignore file detected. Attempting migration');
    const eslintIgnorePath = getPathFromCwd('.eslintignore');
    const userIgnores = migrateEslintignore(eslintIgnorePath);

    await cleanUpOldEslintFiles();
  }

  const newEslintConfigFilename = 'eslint.config.js';
  const eslintCacheFilename = '.eslintcache';
  const eslintConfig = dedent`const { eslintConfigSku } = require('sku/config/eslint');

                              module.exports = eslintConfigSku;`;
  await writeFileToCWD(newEslintConfigFilename, eslintConfig);

  gitIgnorePatterns.push(newEslintConfigFilename, eslintCacheFilename);

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
