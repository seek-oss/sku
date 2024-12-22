import chalk from 'chalk';
import { SkuContext } from '@/context/createSkuContext.js';

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
      console.log(chalk.red(`Unknown environment: ${chalk.bold(environment)}`));
      process.exit(1);
    }

    console.log(`Using ${chalk.bold(environment)} environment`);
  }

  return environment;
};
