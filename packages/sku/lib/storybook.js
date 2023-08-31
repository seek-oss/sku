const path = require('path');
const fs = require('fs/promises');
const debug = require('debug');

const log = debug('sku:storybook');

const managedConfigBanner = require('./managedConfigBanner');

// Since this config will be in the user's project, we can use ESM
// Spread `storybookConfig` to prevent warning
// https://github.com/storybookjs/storybook/issues/23675
const mainConfigFileContents = `${managedConfigBanner}
import storybookConfig from 'sku/config/storybook';

export default { ...storybookConfig };
`;

const storybookMainConfigPath = '.storybook/main.js';
const storybookConfigDirectory = path.dirname(storybookMainConfigPath);

const setUpStorybookConfigDirectory = async () => {
  await fs.mkdir(storybookConfigDirectory, { recursive: true });
  log(
    `Created '${path.resolve(
      storybookConfigDirectory,
    )}' directory if it didn't exist`,
  );

  await fs.writeFile(storybookMainConfigPath, mainConfigFileContents);
  log(
    `Wrote storybook config file to '${path.resolve(storybookMainConfigPath)}'`,
  );
};

module.exports = { setUpStorybookConfigDirectory, storybookMainConfigPath };
