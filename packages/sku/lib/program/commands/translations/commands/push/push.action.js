const chalk = require('chalk');
const {
  ensureBranch,
  getResolvedVocabConfig,
} = require('../../helpers/translation-helpers');
const { push } = require('@vocab/phrase');
const { configureProject } = require('../../../../../utils/configure');

const log = (message) => console.log(chalk.cyan(message));

const pushAction = async ({ deleteUnusedKeys }) => {
  await configureProject();
  try {
    const vocabConfigFromSkuConfig = await getResolvedVocabConfig({
      translationSubCommand: 'push',
    });
    const branch = await ensureBranch();

    log('Pushing translations to Phrase...');
    await push({ branch, deleteUnusedKeys }, vocabConfigFromSkuConfig);
    log('Successfully pushed translations to Phrase');
  } catch (e) {
    if (e) {
      console.error(`Error running ${chalk.bold(`translations push`)}:`, e);
    }
  }
};

module.exports = pushAction;
