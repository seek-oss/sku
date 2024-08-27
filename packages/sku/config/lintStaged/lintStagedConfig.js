const { isYarn } = require('../../lib/packageManager');
const { lintExtensions } = require('../../lib/lint');
const { getCommand } = require('../../lib/packageManager');

/**
 * @type {import('lint-staged').Config}
 */
const config = {
  [`**/*.{${lintExtensions},md}`]: ['sku format', 'sku lint'],
};

// Yarn lock integrity check
if (isYarn) {
  config['+(package.json|yarn.lock)'] =
    // The function form allows running the command without file arguments
    // https://github.com/lint-staged/lint-staged#example-run-tsc-on-changes-to-typescript-files-but-do-not-pass-any-filename-arguments
    () => getCommand('yarn', 'install', ['--check-files']);
}

module.exports = config;
