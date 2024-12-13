import { validate } from '@vocab/core';
import chalk from 'chalk';

import { getResolvedVocabConfig } from '../../helpers/translation-helpers.js';
import { configureProject } from '../../../../../utils/configure.js';

const log = (message: string) => console.log(chalk.cyan(message));

export const validateAction = async () => {
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
