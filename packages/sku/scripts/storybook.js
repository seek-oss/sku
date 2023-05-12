const path = require('path');
const { argv } = require('../config/args');
const gracefulSpawn = require('../lib/gracefulSpawn');
const { storybookPort } = require('../context');
const startStorybookPath = require.resolve('@storybook/react/bin/index.js');
const configDir = path.resolve(__dirname, '../config/storybook/start');
const { watchVocabCompile } = require('../lib/runVocab');
const { setUpStorybookPreviewFile } = require('../lib/storybook');

argv.push('--port', storybookPort);
argv.push('--config-dir', configDir);
argv.push('--quiet');

(async () => {
  await watchVocabCompile();
  await setUpStorybookPreviewFile(configDir);

  const storybookProcess = gracefulSpawn(startStorybookPath, argv, {
    stdio: 'inherit',
    env: process.env,
  });

  storybookProcess.on('exit', (exitCode) => {
    process.exit(exitCode);
  });
})();
