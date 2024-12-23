import configure from '@/utils/configureApp.js';
import { SkuContext } from '@/context/createSkuContext.js';

export const configureAction = ({ skuContext }: { skuContext: SkuContext }) => {
  configure(skuContext);
};
