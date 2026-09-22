import {
  getPathFromCwd,
  isAtLeastPnpmV10,
  isAtLeastRecommendedPnpmVersion,
  writeFileToCWD,
  rootDir,
} from '@sku-private/utils';
import { banner, strong } from '@sku-private/utils/console';

import { existsSync, readFileSync } from 'node:fs';
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

// sku should always be a dev dependency now that @sku-lib/create installs it
// as one, but some repos may still have it as a regular dependency
const warnOnSkuDependency = () => {
  const packageJsonPath = getPathFromCwd('package.json');

  if (!existsSync(packageJsonPath)) {
    return;
  }

  const { dependencies } = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

  if (dependencies?.sku) {
    banner('caution', 'sku dependency detected', [
      `${strong('sku')} is installed as a ${strong('dependency')} in ${strong(
        packageJsonPath,
      )}.`,
      `${strong('sku')} should be installed in ${strong('devDependencies')}.`,
    ]);
  }
};

export default async (skuContext: SkuContext) => {
  const { paths, httpsDevServer, languages, hosts } = skuContext;

  validateSkuConfigFormat(paths.appSkuConfigPath);

  warnOnSkuDependency();

  // Ignore target directories (active config target)
  const targetDirectories = [...new Set([addSep(paths.relativeTarget)])];

  const gitIgnorePatterns = [
    // Ignore webpack bundle report output
    addSep(bundleReportFolder),
    addSep(coverageFolder),
    ...targetDirectories,
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
  // no reason to ever commit the certificate so we can always ignore it
  gitIgnorePatterns.push(selfSignedCertificateDirName);
  if (httpsDevServer) {
    await getCertificate(selfSignedCertificateDirName, hosts);
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
