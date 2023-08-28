const { argv } = require('../config/args');
const gracefulSpawn = require('../lib/gracefulSpawn');
const { storybookPort } = require('../context');
const startStorybookPath = require.resolve('@storybook/cli/bin/index');
const { watchVocabCompile } = require('../lib/runVocab');
const { setUpStorybookConfigDirectory } = require('../lib/storybook');

// Unshift args to allow pushing --ci as an arg during storybook-config tests
argv.unshift('--quiet');
argv.unshift('--port', storybookPort);
argv.unshift('dev');

(async () => {
  await watchVocabCompile();
  await setUpStorybookConfigDirectory();

  const storybookProcess = gracefulSpawn(startStorybookPath, argv, {
    stdio: 'inherit',
    env: process.env,
  });

  storybookProcess.on('exit', (exitCode) => {
    process.exit(exitCode);
  });
})();
