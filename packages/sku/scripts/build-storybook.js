// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const { rm } = require('node:fs/promises');
const { argv, config } = require('../config/args');
const gracefulSpawn = require('../lib/gracefulSpawn');
const { storybookTarget } = require('../context');
const buildStorybookPath = require.resolve('@storybook/cli/bin/index');
const { runVocabCompile } = require('../lib/runVocab');
const { setUpStorybookConfigDirectory } = require('../lib/storybook');

(async () => {
  await runVocabCompile();
  await rm(storybookTarget, { recursive: true, force: true });
  await setUpStorybookConfigDirectory();

  argv.push('build');
  argv.push('--output-dir', storybookTarget);
  argv.push('--quiet');

  const storybookProcess = gracefulSpawn(buildStorybookPath, argv, {
    stdio: 'inherit',
    env: { ...process.env, SKU_CONFIG: config },
  });

  storybookProcess.on('exit', (exitCode) => {
    process.exit(exitCode);
  });
})();
