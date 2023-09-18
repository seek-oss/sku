// @ts-check
const { yellow, cyan, gray } = require('chalk');
const { ESLint } = require('eslint');
const eslintConfig = require('../config/eslint/eslintConfig');
const { lintExtensions } = require('./lint');
const assert = require('node:assert');

const extensions = lintExtensions.map((ext) => `.${ext}`);

/**
 * @param {{ fix?: boolean, paths?: string[] }} options
 */
const runESLint = async ({ fix = false, paths }) => {
  console.log(cyan(`${fix ? 'Fixing' : 'Checking'} code with ESLint`));

  const eslint = new ESLint({
    baseConfig: eslintConfig,
    extensions,
    useEslintrc: false,
    fix,
    cache: true,
  });
  const checkAll = typeof paths === 'undefined';
  /* Whitelist the file extensions that our ESLint setup currently supports */
  const filteredFilePaths = checkAll
    ? ['.']
    : paths.filter((filePath) =>
        [...extensions, '.json'].some((ext) => filePath.endsWith(ext)),
      );

  if (filteredFilePaths.length === 0) {
    console.log(gray(`No JS files to lint`));
  } else {
    console.log(gray(`Paths: ${filteredFilePaths.join(' ')}`));
    try {
      const lintResults = await eslint.lintFiles(filteredFilePaths);

      if (fix) {
        ESLint.outputFixes(lintResults);
      } else {
        const { warningCount, errorCount } = lintResults.reduce(
          (acc, result) => {
            return {
              warningCount: acc.warningCount + result.warningCount,
              errorCount: acc.errorCount + result.errorCount,
            };
          },
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
        console.warn(yellow(`Warning: ${e.message}`));
      } else {
        console.warn(yellow('ESLint encountered an error:'));
        console.log(e.message);
        return Promise.reject();
      }
    }
  }
};

module.exports = {
  /** @param {string[] | undefined} paths */
  check: (paths) => runESLint({ paths }),
  /** @param {string[] | undefined} paths */
  fix: (paths) => runESLint({ fix: true, paths }),
};
