import { posix as path } from 'node:path';
import chalk from 'chalk';
import dedent from 'dedent';

// Copied from `package-name-regex@4.0.0`
const packageNameRegex =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export class ProjectValidationError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = 1,
  ) {
    super(message);
    this.name = 'ProjectValidationError';
  }
}

export function validateProjectName(projectName: string): void {
  if (!projectName) {
    throw new ProjectValidationError(chalk.red('Project name is required'));
  }

  const initDir = path.resolve(projectName);
  const appName = path.basename(initDir);

  const reservedNames = [
    'react',
    'react-dom',
    'sku',
    'braid-design-system',
  ].sort();

  const isValidPackageName = packageNameRegex.test(appName);

  if (!isValidPackageName) {
    const message = dedent`
      Could not create a project called ${chalk.red(
        `"${appName}"`,
      )} because of npm naming restrictions. 
      Please see https://docs.npmjs.com/cli/configuring-npm/package-json for package name rules.
    `;
    throw new ProjectValidationError(message);
  }

  if (reservedNames.indexOf(appName) >= 0) {
    const message = chalk.red(dedent`
      We cannot create a project called 
      ${chalk.green(appName)} 
      because a dependency with the same name exists.
      Due to the way npm works, the following names are not allowed:

      ${chalk.cyan(reservedNames.map((depName) => `  ${depName}`).join('\n'))}

      Please choose a different project name.
    `);
    throw new ProjectValidationError(message);
  }
}
