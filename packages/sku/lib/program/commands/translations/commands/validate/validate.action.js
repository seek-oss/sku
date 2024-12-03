import { validate } from '@vocab/core';
import { bold, cyan } from 'chalk';

import { getResolvedVocabConfig } from '../../helpers/translation-helpers';
import { configureProject } from '../../../../../utils/configure';

const log = (message) => console.log(cyan(message));

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
      console.error(`Error running ${bold(`translations validate`)}:`, e);
    }
    process.exit(1);
  }
};
