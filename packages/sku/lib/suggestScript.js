// @ts-check
import { getRunCommand, getExecuteCommand } from './packageManager.js';

import chalk from 'chalk';
import { requireFromCwd } from './cwd.js';

/**
 * @param {string} scriptContents
 * @returns {string | undefined}
 */
const findPackageScriptName = (scriptContents) => {
  let pkg;

  try {
    pkg = requireFromCwd('./package.json');
  } catch {
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
  const packageScriptName = findPackageScriptName(`sku ${scriptName}`);

  const command = packageScriptName
    ? getRunCommand(packageScriptName)
    : getExecuteCommand(['sku', scriptName]);

  const sudoPrefix = options.sudo ? 'sudo ' : '';

  return `${sudoPrefix}${command}`;
};

/**
 * @param {string} scriptName
 * @param {Options | undefined} [options]
 */
export const suggestScript = (scriptName, options) => {
  const suggestedScript = getSuggestedScript(scriptName, options);

  console.log(
    chalk.blue(`To fix this issue, run '${chalk.bold(suggestedScript)}'`),
  );
};
