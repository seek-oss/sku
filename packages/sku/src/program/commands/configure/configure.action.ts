import configure from '../../../utils/configureApp.js';
import type { SkuContext } from '../../../context/createSkuContext.js';

export const configureAction = async ({
  skuContext,
}: {
  skuContext: SkuContext;
}) => {
  await configure(skuContext, { mode: 'enforce' });
};
