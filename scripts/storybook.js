const path = require('path');
const gracefulSpawn = require('../lib/gracefulSpawn');
const builds = require('../config/builds');
const { storybookPort } = builds[0];
const startStorybookPath = require.resolve('@storybook/react/bin/index.js');
const configDir = path.resolve(__dirname, '..', 'config', 'storybook');

const storybookProcess = gracefulSpawn(
  startStorybookPath,
  ['--port', storybookPort, '--config-dir', configDir],
  {
    stdio: 'inherit'
  }
);

storybookProcess.on('exit', exitCode => {
  process.exit(exitCode);
});
