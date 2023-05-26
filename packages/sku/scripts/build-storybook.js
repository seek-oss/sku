// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const path = require('path');
const { rimraf } = require('rimraf');
const { argv } = require('../config/args');
const gracefulSpawn = require('../lib/gracefulSpawn');
const { storybookTarget } = require('../context');
const buildStorybookPath = require.resolve('@storybook/cli/bin/index');
const configDir = path.resolve(__dirname, '../config/storybook/build');
const { runVocabCompile } = require('../lib/runVocab');
const { setUpStorybookPreviewFile } = require('../lib/storybook');

(async () => {
  await runVocabCompile();
  await rimraf(storybookTarget);
  await setUpStorybookPreviewFile(configDir);

  argv.push('build');
  argv.push('--config-dir', configDir);
  argv.push('--output-dir', storybookTarget);
  argv.push('--quiet');

  const storybookProcess = gracefulSpawn(buildStorybookPath, argv, {
    stdio: 'inherit',
    env: process.env,
  });

  storybookProcess.on('exit', (exitCode) => {
    process.exit(exitCode);
  });
})();
