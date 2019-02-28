const path = require('path');
const { argv } = require('../config/args');
const gracefulSpawn = require('../lib/gracefulSpawn');
const { storybookTarget } = require('../context');
const startStorybookPath = require.resolve('@storybook/react/bin/build.js');
const configDir = path.resolve(__dirname, '..', 'config', 'storybook');

argv.push('--config-dir', configDir);
argv.push('--output-dir', storybookTarget || '');

const storybookProcess = gracefulSpawn(startStorybookPath, argv, {
  stdio: 'inherit'
});

storybookProcess.on('exit', exitCode => {
  process.exit(exitCode);
});
