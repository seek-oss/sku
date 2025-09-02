import {
  getRunCommand,
  getExecuteCommand,
  requireFromCwd,
} from '@sku-lib/utils';

import chalk from 'chalk';

const findPackageScriptName = (scriptContents: string): string | undefined => {
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

interface Options {
  sudo: boolean;
}

const getSuggestedScript = (
  scriptName: string,
  options: Options | undefined = { sudo: false },
) => {
  const packageScriptName = findPackageScriptName(`sku ${scriptName}`);

  const command = packageScriptName
    ? getRunCommand(packageScriptName)
    : getExecuteCommand(['sku', scriptName]);

  const sudoPrefix = options.sudo ? 'sudo ' : '';

  return `${sudoPrefix}${command}`;
};

export const suggestScript = (scriptName: string, options?: Options) => {
  const suggestedScript = getSuggestedScript(scriptName, options);

  console.log(
    chalk.blue(`To fix this issue, run '${chalk.bold(suggestedScript)}'`),
  );
};
