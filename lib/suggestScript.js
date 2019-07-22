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

module.exports = async (scriptName, options = { sudo: false }) => {
  const suggest = command =>
    console.log(
      chalk.blue(
        `To fix this issue, run '${chalk.bold(
          `${options.sudo ? 'sudo ' : ''}${command}`,
        )}'`,
      ),
    );

  const isYarnProject = await exists(getPathFromCwd('yarn.lock'));

  try {
    const packageScript = findPackageScript(`sku ${scriptName}`);

    if (packageScript) {
      suggest(`${isYarnProject ? 'yarn' : 'npm run'} ${packageScript}`);
    } else {
      suggest(`${isYarnProject ? 'yarn' : 'npx'} sku ${scriptName}`);
    }
  } catch (err) {
    suggest(`npx sku ${scriptName}`);
  }
};
