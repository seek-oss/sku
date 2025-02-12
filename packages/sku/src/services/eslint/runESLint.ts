import chalk from 'chalk';
import { loadESLint } from 'eslint';
import { createEslintConfig } from './config/index.js';
import { lintExtensions } from './lint.js';
import assert from 'node:assert';
import type { SkuContext } from '@/context/createSkuContext.js';

const extensions = lintExtensions.map((ext) => `.${ext}`);

const runESLint = async ({
  fix = false,
  paths,
  skuContext,
}: {
  fix?: boolean;
  paths?: string[];
  skuContext: SkuContext;
}) => {
  console.log(chalk.cyan(`${fix ? 'Fixing' : 'Checking'} code with ESLint`));

  const eslintConfigSku = createEslintConfig({
    configPath: skuContext.configPath,
  });

  const ESLint = await loadESLint({ useFlatConfig: true });
  const eslint = new ESLint({
    baseConfig: eslintConfigSku,
    fix,
    cache: true,
    overrideConfig: {
      linterOptions: {
        reportUnusedDisableDirectives: true,
      },
    },
  });

  const checkAll = typeof paths === 'undefined';
  /* Whitelist the file extensions that our ESLint setup currently supports */
  const filteredFilePaths = checkAll
    ? ['.']
    : paths.filter((filePath) =>
        [...extensions, '.json'].some((ext) => filePath.endsWith(ext)),
      );

  if (filteredFilePaths.length === 0) {
    console.log(chalk.gray(`No files to lint`));
    return Promise.resolve();
  }

  console.log(chalk.gray(`Paths: ${filteredFilePaths.join(' ')}`));
  try {
    const lintResults = await eslint.lintFiles(filteredFilePaths);

    if (fix) {
      ESLint.outputFixes(lintResults);
    } else {
      const { warningCount, errorCount } = lintResults.reduce(
        (acc, result) => ({
          warningCount: acc.warningCount + result.warningCount,
          errorCount: acc.errorCount + result.errorCount,
        }),
        { warningCount: 0, errorCount: 0 },
      );

      if (errorCount || warningCount) {
        const formatter = await eslint.loadFormatter();
        console.log(await formatter.format(lintResults));
      }

      if (errorCount > 0) {
        return Promise.reject();
      }
    }
  } catch (e) {
    assert(e instanceof Error);

    if (e.message.includes('No files matching')) {
      console.warn(chalk.yellow(`Warning: ${e.message}`));
    } else {
      console.warn(chalk.yellow('ESLint encountered an error:'));
      console.log(e.message);
      return Promise.reject();
    }
  }
};

export const check = ({
  paths,
  skuContext,
}: {
  paths?: string[];
  skuContext: SkuContext;
}) => runESLint({ paths, skuContext });

export const fix = ({
  paths,
  skuContext,
}: {
  paths?: string[];
  skuContext: SkuContext;
}) => runESLint({ fix: true, paths, skuContext });
