import { push } from '@vocab/phrase';

import {
  ensureBranch,
  getResolvedVocabConfig,
} from '../../helpers/translation-helpers.js';
import { configureProject } from '../../../../../utils/configure.js';
import type { SkuContext } from '../../../../../context/createSkuContext.js';
import { accentLight, strong } from '@sku-private/utils/console';

const log = (message: string) => console.log(accentLight(message));

export const pushAction = async ({
  autoTranslate,
  deleteUnusedKeys,
  skuContext,
}: {
  autoTranslate?: boolean;
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
    await push(
      { autoTranslate, branch, deleteUnusedKeys },
      vocabConfigFromSkuConfig,
    );
    log('Successfully pushed translations to Phrase');
  } catch (e) {
    if (e) {
      console.error(`Error running ${strong(`translations push`)}:`, e);
    }
    process.exit(1);
  }
};
