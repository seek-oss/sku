const path = require('path');
const { promisify } = require('util');
const rimraf = promisify(require('rimraf'));
const { argv } = require('../config/args');
const gracefulSpawn = require('../lib/gracefulSpawn');
const { storybookTarget } = require('../context');
const startStorybookPath = require.resolve('@storybook/react/bin/build.js');
const configDir = path.resolve(__dirname, '..', 'config', 'storybook', 'build');

(async () => {
  await rimraf(storybookTarget);

  argv.push('--config-dir', configDir);
  argv.push('--output-dir', storybookTarget);

  const storybookProcess = gracefulSpawn(startStorybookPath, argv, {
    stdio: 'inherit',
  });

  storybookProcess.on('exit', exitCode => {
    process.exit(exitCode);
  });
})();
