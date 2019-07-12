// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const path = require('path');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));
const { argv } = require('../config/args');
const gracefulSpawn = require('../lib/gracefulSpawn');
const { storybookTarget } = require('../context');
const buildStorybookPath = require.resolve('@storybook/react/bin/build.js');
const configDir = path.resolve(__dirname, '..', 'config', 'storybook', 'build');

(async () => {
  await rimraf(storybookTarget);

  argv.push('--config-dir', configDir);
  argv.push('--output-dir', storybookTarget);

  const storybookProcess = gracefulSpawn(buildStorybookPath, argv, {
    stdio: 'inherit',
    env: process.env,
  });

  storybookProcess.on('exit', exitCode => {
    process.exit(exitCode);
  });
})();
