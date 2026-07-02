import {
  getPathFromCwd,
  isAtLeastPnpmV10,
  isAtLeastRecommendedPnpmVersion,
  writeFileToCWD,
  rootDir,
} from '@sku-private/utils';

import { rm } from 'node:fs/promises';
import path from 'node:path';

import dedent from 'dedent';

import ensureGitignore from 'ensure-gitignore';

import prettierConfig from '../config/prettier.js';
import { createTSConfig } from '../services/typescript/tsconfig.js';
import { bundleReportFolder } from '../services/webpack/config/plugins/bundleAnalyzer.js';

import getCertificate from './certificate.js';
import { syncPathAliasImports } from './pathAliasImports.js';
import { validateSkuConfigFormat } from './validateSkuConfigFormat.js';

import type { SkuContext } from '../context/createSkuContext.js';
import { getPnpmConfigDependencies } from '../services/packageManager/getPnpmConfigDependencies.js';
import { validatePnpmConfig } from '../services/packageManager/pnpmConfig.js';
import { warnOnLegacyReact } from './warnOnLegacyReact.js';

const coverageFolder = 'coverage';

const convertToForwardSlashPaths = (pathStr: string) =>
  pathStr.replace(/\\/g, '/');

const addSep = (p: string) => `${p}${path.sep}`;

export default async (skuContext: SkuContext) => {
  const { paths, httpsDevServer, languages, hosts } = skuContext;

  validateSkuConfigFormat(paths.appSkuConfigPath);

  // Ignore target directories
  const webpackTargetDirectory = addSep(paths.relativeTarget);

  const gitIgnorePatterns = [
    // Ignore webpack bundle report output
    addSep(bundleReportFolder),
    addSep(coverageFolder),
    webpackTargetDirectory,
  ];

  const eslintConfigFilename = 'eslint.config.mjs';
  const eslintCacheFilename = '.eslintcache';

  const resolvedConfigPath = skuContext.configPath
    ? `'${path.resolve(skuContext.configPath)}'`
    : '';

  const eslintConfig = dedent`import { createEslintConfig } from 'sku/config/eslint';

                              export default await createEslintConfig(${resolvedConfigPath});`;
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
  await writeFileToCWD(tsConfigFileName, createTSConfig(skuContext));
  gitIgnorePatterns.push(tsConfigFileName);

  await syncPathAliasImports(skuContext.pathAliases);

  const prettierIgnorePatterns = [...gitIgnorePatterns, 'pnpm-lock.yaml'];

  if (languages) {
    const generatedVocabFileGlob = '**/*.vocab/index.ts';
    gitIgnorePatterns.push(generatedVocabFileGlob);
    prettierIgnorePatterns.push(generatedVocabFileGlob);
  }

  // Write `.prettierignore`
  // @ts-expect-error
  await ensureGitignore({
    filepath: getPathFromCwd('.prettierignore'),
    comment: 'managed by sku',
    patterns: prettierIgnorePatterns.map(convertToForwardSlashPaths),
  });

  // Generate self-signed certificate and ignore
  const selfSignedCertificateDirName = '.ssl';
  if (httpsDevServer) {
    await getCertificate(selfSignedCertificateDirName, hosts);
    gitIgnorePatterns.push(selfSignedCertificateDirName);
  } else {
    await rm(getPathFromCwd(selfSignedCertificateDirName), {
      recursive: true,
      force: true,
    });
  }

  // Write `.gitignore`
  // @ts-expect-error
  await ensureGitignore({
    filepath: getPathFromCwd('.gitignore'),
    comment: 'managed by sku',
    patterns: gitIgnorePatterns.map(convertToForwardSlashPaths),
  });

  // If there's no rootDir, we're either inside `@sku-lib/create`, or we can't determine the user's package manager
  if (rootDir && isAtLeastPnpmV10()) {
    const pnpmConfigDependencies = await getPnpmConfigDependencies();

    const hasRecommendedPnpmVersionInstalled =
      isAtLeastRecommendedPnpmVersion();
    const pnpmPluginSkuInstalled =
      pnpmConfigDependencies.includes('pnpm-plugin-sku');

    await validatePnpmConfig({
      hasRecommendedPnpmVersionInstalled,
      pnpmPluginSkuInstalled,
    });
  }

  warnOnLegacyReact();
};
