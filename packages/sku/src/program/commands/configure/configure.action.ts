import configure from '#src/utils/configureApp.js';
import type { SkuContext } from '#src/context/createSkuContext.js';

export const configureAction = ({ skuContext }: { skuContext: SkuContext }) => {
  configure(skuContext);
};
