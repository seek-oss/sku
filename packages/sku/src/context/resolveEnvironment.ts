import { error, strong } from '@sku-private/utils/console';
import type { SkuContext } from './createSkuContext.js';

export const resolveEnvironment = ({
  environment: environmentOption,
  skuContext,
}: {
  environment?: string;
  skuContext: SkuContext;
}) => {
  const environment = environmentOption || skuContext.environments?.[0] || '';

  if (environment) {
    if (!skuContext.environments?.includes(environment)) {
      console.log(error(`Unknown environment: ${strong(environment)}`));
      process.exit(1);
    }

    console.log(`Using ${strong(environment)} environment`);
  }

  return environment;
};
