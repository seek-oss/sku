const { yellow, cyan, gray } = require('chalk');
const { ESLint } = require('eslint');
const eslintConfig = require('../config/eslint/eslintConfig');
const { lintExtensions } = require('./lint');

const extensions = lintExtensions.map((ext) => `.${ext}`);

/**
 * @param {{ fix?: boolean, paths?: string[] }}
 */
const runESLint = async ({ fix = false, paths }) => {
  console.log(cyan(`${fix ? 'Fixing' : 'Checking'} code with ESLint`));

  const eslint = new ESLint({
    baseConfig: eslintConfig,
    extensions,
    useEslintrc: false,
    fix,
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
      const report = await eslint.lintFiles(filteredFilePaths);

      if (fix) {
        ESLint.outputFixes(report);
      } else {
        const { errorCount, warningCount, results } = report;

        if (errorCount || warningCount) {
          const formatter = await eslint.loadFormatter();
          console.log(formatter(results));
        }

        if (errorCount > 0) {
          return Promise.reject();
        }
      }
    } catch (e) {
      if (e && e.message && e.message.includes('No files matching')) {
        console.warn(yellow(`Warning: ${e.message}`));
      } else {
        return Promise.reject();
      }
    }
  }
};

module.exports = {
  check: (paths) => runESLint({ paths }),
  fix: (paths) => runESLint({ fix: true, paths }),
};
