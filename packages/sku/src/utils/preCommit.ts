import { error } from '@sku-private/utils/console';
import config from './lintStagedConfig.js';

const preCommit = async () => {
  let success = false;
  try {
    // existing JSDoc type definitions.
    // https://github.com/lint-staged/lint-staged/issues/1359
    const { default: lintStaged } = await import('lint-staged');
    success = await lintStaged({ config });
  } catch (e) {
    console.error(error(String(e)));
  }

  if (!success) {
    throw new Error('Error: Pre-commit failed');
  }
};

export default preCommit;
