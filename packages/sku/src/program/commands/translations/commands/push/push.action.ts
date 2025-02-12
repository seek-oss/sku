import chalk from 'chalk';
import { push } from '@vocab/phrase';

import {
  ensureBranch,
  getResolvedVocabConfig,
} from '../../helpers/translation-helpers.js';
import { configureProject } from '@/utils/configure.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const log = (message: string) => console.log(chalk.cyan(message));

export const pushAction = async ({
  deleteUnusedKeys,
  skuContext,
}: {
  deleteUnusedKeys?: boolean;
  skuContext: SkuContext;
}) => {
  await configureProject(skuContext);
  try {
    const vocabConfigFromSkuConfig = await getResolvedVocabConfig({
      translationSubCommand: 'push',
      skuContext,
    });
    const branch = await ensureBranch();

    log('Pushing translations to Phrase...');
    await push({ branch, deleteUnusedKeys }, vocabConfigFromSkuConfig);
    log('Successfully pushed translations to Phrase');
  } catch (e) {
    if (e) {
      console.error(`Error running ${chalk.bold(`translations push`)}:`, e);
    }
    process.exit(1);
  }
};
