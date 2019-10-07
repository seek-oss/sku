const { promisify } = require('util');
const exists = promisify(require('fs').exists);
const chalk = require('chalk');
const { getPathFromCwd, requireFromCwd } = require('./cwd');

const findPackageScript = scriptContents => {
  let pkg;
  try {
    pkg = requireFromCwd('package.json');
  } catch (err) {
    pkg = { scripts: {} };
  }

  const scripts = pkg.scripts || {};

  return Object.keys(scripts).find(
    scriptName => scripts[scriptName] === scriptContents,
  );
};

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
