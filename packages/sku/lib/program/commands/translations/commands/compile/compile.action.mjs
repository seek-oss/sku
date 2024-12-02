import { compile } from '@vocab/core';
import chalk from 'chalk';

import { getResolvedVocabConfig } from '../../helpers/translation-helpers';
import { configureProject } from '../../../../../utils/configure.js';

const log = (message) => console.log(chalk.cyan(message));

export const compileAction = async ({ watch }) => {
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
    process.exit(1);
  }
};
