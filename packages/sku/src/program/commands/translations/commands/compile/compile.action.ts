import { compile } from '@vocab/core';

import { getResolvedVocabConfig } from '../../helpers/translation-helpers.js';
import { configureProject } from '../../../../../utils/configure.js';
import type { SkuContext } from '../../../../../context/createSkuContext.js';
import { accentLight, strong } from '@sku-private/utils/console';

const log = (message: string) => console.log(accentLight(message));

export const compileAction = async ({
  watch,
  skuContext,
}: {
  watch: boolean;
  skuContext: SkuContext;
}) => {
  await configureProject(skuContext);
  try {
    const vocabConfigFromSkuConfig = await getResolvedVocabConfig({
      translationSubCommand: 'compile',
      skuContext,
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
      console.error(`Error running ${strong(`translations compile`)}:`, e);
    }
    process.exit(1);
  }
};
