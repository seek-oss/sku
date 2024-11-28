const { validate } = require('@vocab/core');
const chalk = require('chalk');
const { getResolvedVocabConfig } = require('../../helpers/translation-helpers');
const { configureProject } = require('../../../../../utils/configure');

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
    process.exit(1);
  }
};

module.exports = validateAction;
