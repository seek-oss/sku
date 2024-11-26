const { validate } = require('@vocab/core');
const chalk = require('chalk');
const { getResolvedVocabConfig } = require('../../helpers/translation-helpers');
const { configureProject } = require('../../../../../utils/config-validators');

const log = (message) => console.log(chalk.cyan(message));

const validateAction = async () => {
  await configureProject();
  try {
    const vocabConfigFromSkuConfig = await getResolvedVocabConfig({
      translationSubCommand: 'validate',
    });

    log('Validating translations...');
    await validate(vocabConfigFromSkuConfig);
    log('Successfully validated translations');
  } catch (e) {
    if (e) {
      console.error(`Error running ${chalk.bold(`translations validate`)}:`, e);
    }
  }
};

module.exports = validateAction;
