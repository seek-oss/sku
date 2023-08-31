const { runCommand, isNpm, packageManager } = require('./packageManager');

const chalk = require('chalk');
const { requireFromCwd } = require('./cwd');

/**
 * @param {string} scriptContents
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
 * @param {boolean} isPackageScript
 */
const resolvePackageManagerCommand = (isPackageScript) => {
  if (isPackageScript) {
    return runCommand;
  }

  return isNpm ? 'npx' : packageManager;
};

/**
 * @typedef {object} Options
 * @property {boolean} sudo
 */

/**
 * @param {string} scriptName
 * @param {Options | undefined} options
 */
const getSuggestedScript = async (scriptName, options = { sudo: false }) => {
  const packageScript = findPackageScript(`sku ${scriptName}`);

  const packageManagerCommand = resolvePackageManagerCommand(
    Boolean(packageScript),
  );

  const packageOrSkuScript = packageScript
    ? packageScript
    : `sku ${scriptName}`;

  const sudoPrefix = options.sudo ? 'sudo ' : '';

  return `${sudoPrefix}${packageManagerCommand} ${packageOrSkuScript}`;
};

/**
 * @param {string} scriptName
 * @param {Options | undefined} options
 */
const suggestScript = async (scriptName, options) => {
  const suggestedScript = await getSuggestedScript(scriptName, options);

  console.log(
    chalk.blue(`To fix this issue, run '${chalk.bold(suggestedScript)}'`),
  );
};

module.exports = {
  suggestScript,
};
