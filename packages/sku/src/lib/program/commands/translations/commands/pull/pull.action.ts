import chalk from 'chalk';
import { pull } from '@vocab/phrase';

import {
  ensureBranch,
  getResolvedVocabConfig,
} from '../../helpers/translation-helpers.js';
import { configureProject } from '../../../../../utils/configure.js';

const log = (message: string) => console.log(chalk.cyan(message));

export const pullAction = async () => {
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
    process.exit(1);
  }
};
