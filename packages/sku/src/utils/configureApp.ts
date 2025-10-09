import { getPathFromCwd, writeFileToCWD } from '@sku-lib/utils';

import { rm } from 'node:fs/promises';
import path from 'node:path';

import dedent from 'dedent';
import chalk from 'chalk';

import ensureGitignore from 'ensure-gitignore';

import prettierConfig from '../config/prettier.js';
import createTSConfig from '../services/typescript/tsconfig.js';
import { bundleReportFolder } from '../services/webpack/config/plugins/bundleAnalyzer.js';
import {
  shouldMigrateOldEslintConfig,
  migrateEslintignore,
  cleanUpOldEslintFiles,
  addEslintIgnoreToSkuConfig,
} from '../services/eslint/eslintMigration.js';

import getCertificate from './certificate.js';

import { hasErrorMessage } from './error-guards.js';
import type { SkuContext } from '../context/createSkuContext.js';

const coverageFolder = 'coverage';

const convertToForwardSlashPaths = (pathStr: string) =>
  pathStr.replace(/\\/g, '/');

const addSep = (p: string) => `${p}${path.sep}`;

export default async (skuContext: SkuContext) => {
  const { paths, httpsDevServer, languages, hosts } = skuContext;
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
    if (eslintIgnoreExists) {
      console.log("'.eslintignore' file detected. Attempting migration...");

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
        } catch (e: unknown) {
          console.log("Failed to automatically migrate '.eslintignore' file");
          if (hasErrorMessage(e)) {
            console.log('Error:', e.message, '\n');
          }

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

    console.log(
      "Deleting '.eslintrc' and '.eslintignore' files if they exist...",
    );
    await cleanUpOldEslintFiles();
  }

  const eslintConfigFilename = 'eslint.config.mjs';
  const eslintCacheFilename = '.eslintcache';

  const resolvedConfigPath = skuContext.configPath
    ? `'${path.resolve(skuContext.configPath)}'`
    : '';

  const eslintConfig = dedent`import { createEslintConfig } from 'sku/config/eslint';

                              export default createEslintConfig(${resolvedConfigPath});`;
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

  /**
   * ! The following code has been intentionally disabled because `configDependencies` cause issues with Renovate/Mend, leading to no automated dependency updates.
   * ! Once this issue is resolved, we can re-enable this code.
   * ! @see https://github.com/renovatebot/renovate/discussions/38237
   */
  // If there's no rootDir, we're either inside `sku init`, or we can't determine the user's package manager
  // if (rootDir && isAtLeastPnpmV10()) {
  //   const pnpmConfigDependencies = await getPnpmConfigDependencies();

  //   const hasRecommendedPnpmVersionInstalled =
  //     isAtLeastRecommendedPnpmVersion();
  //   const pnpmPluginSkuInstalled =
  //     pnpmConfigDependencies.includes('pnpm-plugin-sku');

  //   await validatePnpmConfig({
  //     hasRecommendedPnpmVersionInstalled,
  //     pnpmPluginSkuInstalled,
  //   });
  // }
};
