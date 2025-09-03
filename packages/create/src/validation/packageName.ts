import { basename } from 'node:path';

// Copied from `package-name-regex@4.0.0`
// See https://github.com/dword-design/package-name-regex/blob/acae7d482b1d03379003899df4d484238625364d/src/index.js#L1-L2
const packageNameRegex =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

const reservedNames = [
  'react',
  'react-dom',
  'sku',
  'braid-design-system',
].sort();

export const validatePackageName = (targetPath: string): void => {
  const appName = basename(targetPath);

  const isValidPackageName = packageNameRegex.test(appName);

  if (!isValidPackageName) {
    throw new Error(
      `Could not create a project called "${appName}" because of npm naming restrictions. Please see https://docs.npmjs.com/cli/configuring-npm/package-json for package name rules.`,
    );
  }

  if (reservedNames.indexOf(appName) >= 0) {
    throw new Error(
      `We cannot create a project called ${appName} because a dependency with the same name exists. Due to the way npm works, the following names are not allowed:\n\n${reservedNames.map((depName) => `  ${depName}`).join('\n')}\n\nPlease choose a different project name.`,
    );
  }
};
