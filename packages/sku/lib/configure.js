const { writeFile, rm } = require('node:fs/promises');
const path = require('node:path');

const ensureGitignore = require('ensure-gitignore');
const { getPathFromCwd } = require('./cwd');

const { paths, httpsDevServer, languages } = require('../context');
const {
  bundleReportFolder,
} = require('../config/webpack/plugins/bundleAnalyzer');
const prettierConfig = require('../config/prettier/prettierConfig');
const eslintConfig = require('../config/eslint/eslintConfig');
const createTSConfig = require('../config/typescript/tsconfig.js');
const getCertificate = require('./certificate');
const managedConfigBanner = require('./managedConfigBanner.js');

const coverageFolder = 'coverage';

const convertToForwardSlashPaths = (pathStr) => pathStr.replace(/\\/g, '/');
const addSep = (p) => `${p}${path.sep}`;
const prependBanner = (str) => `${managedConfigBanner}\n${str}`;

const writeFileToCWD = async (fileName, content, { banner = true } = {}) => {
  const outPath = getPathFromCwd(fileName);
  const str = JSON.stringify(content, null, 2);
  const contentStr = banner ? prependBanner(str) : str;

  await writeFile(outPath, contentStr);
};

module.exports = async () => {
  // Ignore target directories
  const webpackTargetDirectory = addSep(paths.relativeTarget);

  const gitIgnorePatterns = [
    // Ignore webpack bundle report output
    addSep(bundleReportFolder),
    addSep(coverageFolder),
    webpackTargetDirectory,
  ];

  // Generate ESLint configuration
  const eslintConfigFilename = '.eslintrc';
  const eslintCacheFilename = '.eslintcache';
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

  const lintIgnorePatterns = [...gitIgnorePatterns, 'pnpm-lock.yaml'];

  if (languages) {
    const generatedVocabFileGlob = '**/*.vocab/index.ts';
    gitIgnorePatterns.push(generatedVocabFileGlob);
    lintIgnorePatterns.push(generatedVocabFileGlob);
  }

  // Write `.eslintignore`
  await ensureGitignore({
    filepath: getPathFromCwd('.eslintignore'),
    comment: 'managed by sku',
    patterns: lintIgnorePatterns.map(convertToForwardSlashPaths),
  });

  // Write `.prettierignore`
  await ensureGitignore({
    filepath: getPathFromCwd('.prettierignore'),
    comment: 'managed by sku',
    patterns: lintIgnorePatterns.map(convertToForwardSlashPaths),
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
