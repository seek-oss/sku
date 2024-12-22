import { validate } from '@vocab/core';
import chalk from 'chalk';

import { getResolvedVocabConfig } from '../../helpers/translation-helpers.js';
import { configureProject } from '@/utils/configure.js';
import { SkuContext } from '@/context/createSkuContext.js';

const log = (message: string) => console.log(chalk.cyan(message));

export const validateAction = async ({
  skuContext,
}: {
  skuContext: SkuContext;
}) => {
  await configureProject(skuContext);
  try {
    const vocabConfigFromSkuConfig = await getResolvedVocabConfig({
      translationSubCommand: 'validate',
      skuContext,
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
