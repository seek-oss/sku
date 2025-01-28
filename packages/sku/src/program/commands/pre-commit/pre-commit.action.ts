import preCommit from '../../../utils/preCommit.js';
import { configureProject } from '@/utils/configure.js';
import type { SkuContext } from '@/context/createSkuContext.js';

export const preCommitAction = async ({
  skuContext,
}: {
  skuContext: SkuContext;
}) => {
  await configureProject(skuContext);
  try {
    await preCommit();
  } catch {
    process.exit(1);
  }
};
