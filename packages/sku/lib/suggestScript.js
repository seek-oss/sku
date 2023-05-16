const exists = require('./exists');
const chalk = require('chalk');
const { getPathFromCwd, requireFromCwd } = require('./cwd');

/**
 * @param {scriptContents} string
 * */
const findPackageScript = (scriptContents) => {
  let pkg;
  try {
    pkg = requireFromCwd('package.json');
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
 * */

/**
 * @param {string} scriptName
 * @param {Options | undefined} options
 * */
const getSuggestedScript = async (scriptName, options = { sudo: false }) => {
  let script = options.sudo ? 'sudo ' : '';
  const isYarnProject = await exists(getPathFromCwd('yarn.lock'));

  try {
    const packageScript = findPackageScript(`sku ${scriptName}`);

    if (packageScript) {
      script += `${isYarnProject ? 'yarn' : 'npm run'} ${packageScript}`;
    } else {
      script += `${isYarnProject ? 'yarn' : 'npx'} sku ${scriptName}`;
    }
  } catch (err) {
    script += `npx sku ${scriptName}`;
  }

  return script;
};

/**
 * @param {string} scriptName
 * @param {Options | undefined} options
 * */
const suggestScript = async (scriptName, options) => {
  const suggestedScript = await getSuggestedScript(scriptName, options);

  console.log(
    chalk.blue(`To fix this issue, run '${chalk.bold(suggestedScript)}'`),
  );
};

module.exports = {
  suggestScript,
  getSuggestedScript,
};
