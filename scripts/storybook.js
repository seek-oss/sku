const path = require('path');
const { argv } = require('../config/args');
const gracefulSpawn = require('../lib/gracefulSpawn');
const { storybookPort } = require('../context');
const startStorybookPath = require.resolve('@storybook/react/bin/index.js');
const configDir = path.resolve(__dirname, '..', 'config', 'storybook');

argv.push('--port', storybookPort);
argv.push('--config-dir', configDir);

const storybookProcess = gracefulSpawn(startStorybookPath, argv, {
  stdio: 'inherit'
});

storybookProcess.on('exit', exitCode => {
  process.exit(exitCode);
});
