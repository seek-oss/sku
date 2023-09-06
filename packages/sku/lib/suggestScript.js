const { getRunCommand, getExecuteCommand } = require('./packageManager');

const chalk = require('chalk');
const { requireFromCwd } = require('./cwd');

/**
 * @param {string} scriptContents
 * @returns {string | undefined}
 */
const findPackageScript = (scriptContents) => {
  let pkg;

  try {
    pkg = requireFromCwd('./package.json');
  } catch (err) {
    pkg = { scripts: {} };
  }

  const scripts = pkg.scripts || {};

  return Object.keys(scripts).find(
    (scriptName) => scripts[scriptName] === scriptContents,
  );
};

/**
 * @typedef {object} Options
 * @property {boolean} sudo
 */

/**
 * @param {string} scriptName
 * @param {Options | undefined} options
 */
const getSuggestedScript = (scriptName, options = { sudo: false }) => {
  const packageScript = findPackageScript(`sku ${scriptName}`);

  const command = packageScript
    ? getRunCommand(packageScript)
    : getExecuteCommand(['sku', packageScript]);

  const sudoPrefix = options.sudo ? 'sudo ' : '';

  return `${sudoPrefix}${command}`;
};

/**
 * @param {string} scriptName
 * @param {Options | undefined} options
 */
const suggestScript = (scriptName, options) => {
  const suggestedScript = getSuggestedScript(scriptName, options);

  console.log(
    chalk.blue(`To fix this issue, run '${chalk.bold(suggestedScript)}'`),
  );
};

module.exports = {
  suggestScript,
};
