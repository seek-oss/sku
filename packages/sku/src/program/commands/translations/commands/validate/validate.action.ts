import { validate } from '@vocab/core';

import { getResolvedVocabConfig } from '../../helpers/translation-helpers.js';
import { configureProject } from '../../../../../utils/configure.js';
import type { SkuContext } from '../../../../../context/createSkuContext.js';
import { accentLight, strong } from '@sku-private/utils/console';

const log = (message: string) => console.log(accentLight(message));

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
      console.error(`Error running ${strong(`translations validate`)}:`, e);
    }
    process.exit(1);
  }
};
