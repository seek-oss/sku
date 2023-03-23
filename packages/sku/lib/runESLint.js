const { yellow, cyan, gray } = require('chalk');
const EslintCLI = require('eslint').CLIEngine;
const eslintConfig = require('../config/eslint/eslintConfig');

const runESLint = ({ fix = false, paths }) =>
  new Promise((resolve, reject) => {
    console.log(cyan(`${fix ? 'Fixing' : 'Checking'} code with ESLint`));

    const cli = new EslintCLI({
      baseConfig: eslintConfig,
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      useEslintrc: false,
      fix,
    });
    const checkAll = typeof paths === 'undefined';
    /* Whitelist the file extensions that our ESLint setup currently supports */
    const filteredFilePaths = checkAll
      ? ['.']
      : paths.filter(
          (filePath) =>
            filePath.endsWith('.ts') ||
            filePath.endsWith('.tsx') ||
            filePath.endsWith('.js') ||
            filePath.endsWith('.jsx') ||
            filePath.endsWith('.json'),
        );

    if (filteredFilePaths.length === 0) {
      console.log(gray(`No JS files to lint`));
    } else {
      console.log(gray(`Paths: ${filteredFilePaths.join(' ')}`));
      try {
        const report = cli.executeOnFiles(filteredFilePaths);

        if (fix) {
          EslintCLI.outputFixes(report);
        } else {
          const { errorCount, warningCount, results } = report;

          if (errorCount || warningCount) {
            const formatter = cli.getFormatter();
            console.log(formatter(results));
          }

          if (errorCount > 0) {
            reject();
          }
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
  check: (paths) => runESLint({ paths }),
  fix: (paths) => runESLint({ fix: true, paths }),
};
