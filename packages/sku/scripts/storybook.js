const path = require('path');
const { argv, config } = require('../config/args');
const gracefulSpawn = require('../lib/gracefulSpawn');
const { storybookPort } = require('../context');
const startStorybookPath = require.resolve('@storybook/cli/bin/index');
const configDir = path.resolve(__dirname, '../config/storybook/start');
const { watchVocabCompile } = require('../lib/runVocab');
const { setUpStorybookPreviewFile } = require('../lib/storybook');

// Unshift args to allow pushing --ci as an arg during storybook-config tests
argv.unshift('--quiet');
argv.unshift('--config-dir', configDir);
argv.unshift('--port', storybookPort);
argv.unshift('dev');

(async () => {
  await watchVocabCompile();
  await setUpStorybookPreviewFile(configDir);

  const storybookProcess = gracefulSpawn(startStorybookPath, argv, {
    stdio: 'inherit',
    env: { ...process.env, SKU_CONFIG: config },
  });

  storybookProcess.on('exit', (exitCode) => {
    process.exit(exitCode);
  });
})();
