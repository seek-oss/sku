const { yellow, cyan, gray } = require('chalk');
const EslintCLI = require('eslint').CLIEngine;
const eslintConfig = require('../config/eslint/eslintConfig');
const eslintConfigTypescript = require('../config/eslint/eslintConfigTypescript');

const runESLint = ({ fix = false, paths, isTypeScript = false }) =>
  new Promise((resolve, reject) => {
    console.log(cyan(`${fix ? 'Fixing' : 'Checking'} code with ESLint`));

    const baseConfig = isTypeScript ? eslintConfigTypescript : eslintConfig;
    const cli = new EslintCLI({
      baseConfig,
      useEslintrc: false,
      fix,
    });

    const checkAll = typeof paths === 'undefined';
    /* Whitelist the file extensions that our ESLint setup currently supports */
    const filteredFilePaths = checkAll
      ? ['.']
      : paths.filter(filePath =>
          isTypeScript
            ? filePath.endsWith('.ts') || filePath.endsWith('.tsx')
            : filePath.endsWith('.js') ||
              filePath.endsWith('.jsx') ||
              filePath.endsWith('.json'),
        );

    if (filteredFilePaths.length === 0) {
      console.log(gray(`No JS files to lint`));
    } else {
      console.log(gray(`Paths: ${filteredFilePaths.join(' ')}`));
      try {
        const { errorCount, warningCount, results } = cli.executeOnFiles(
          filteredFilePaths,
        );

        if (errorCount || warningCount) {
          const formatter = cli.getFormatter();
          console.log(formatter(results));
        }

        if (errorCount > 0) {
          reject();
        }
      } catch (e) {
        if (e && e.message && e.message.includes('No files matching')) {
          console.warn(yellow(`Warning: ${e.message}`));
        } else {
          reject(e);
        }
      }
    }

    resolve();
  });

module.exports = {
  check: ({ paths, isTypescript }) => runESLint({ paths, isTypescript }),
  fix: paths => runESLint({ fix: true, paths }),
};
