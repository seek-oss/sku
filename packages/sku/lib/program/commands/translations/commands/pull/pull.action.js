const chalk = require('chalk');
const {
  ensureBranch,
  getResolvedVocabConfig,
} = require('../../helpers/translation-helpers');
const { pull } = require('@vocab/phrase');
const { configureProject } = require('../../../../../utils/config-validators');

const log = (message) => console.log(chalk.cyan(message));

const pullAction = async () => {
  await configureProject();
  try {
    const vocabConfigFromSkuConfig = await getResolvedVocabConfig({
      translationSubCommand: 'pull',
    });
    const branch = await ensureBranch();

    log('Pulling translations from Phrase...');
    await pull({ branch }, vocabConfigFromSkuConfig);
    log('Successfully pulled translations from Phrase');
  } catch (e) {
    if (e) {
      console.error(`Error running ${chalk.bold(`translations push`)}:`, e);
    }
  }
};

module.exports = pullAction;
