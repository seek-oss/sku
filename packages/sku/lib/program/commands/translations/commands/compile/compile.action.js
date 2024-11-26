const { compile } = require('@vocab/core');
const chalk = require('chalk');
const { getResolvedVocabConfig } = require('../../helpers/translation-helpers');
const { configureProject } = require('../../../../../utils/config-validators');

const log = (message) => console.log(chalk.cyan(message));

const compileAction = async ({ watch }) => {
  await configureProject();
  try {
    const vocabConfigFromSkuConfig = await getResolvedVocabConfig({
      translationSubCommand: 'compile',
    });

    log('Compiling translations...');

    if (watch) {
      log('Watching for changes to translations');
    }

    await compile({ watch }, vocabConfigFromSkuConfig);

    if (!watch) {
      log('Successfully compiled translations');
    }
  } catch (e) {
    if (e) {
      console.error(`Error running ${chalk.bold(`translations compile`)}:`, e);
    }
  }
};

module.exports = compileAction;
