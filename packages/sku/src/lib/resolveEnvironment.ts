import { environments } from '../context/index.js';
import chalk from 'chalk';

export const resolveEnvironment = ({
  environment: environmentOption,
}: {
  environment?: string;
}) => {
  const environment = environmentOption || environments?.[0] || '';

  if (environment) {
    if (!environments?.includes(environment)) {
      console.log(chalk.red(`Unknown environment: ${chalk.bold(environment)}`));
      process.exit(1);
    }

    console.log(`Using ${chalk.bold(environment)} environment`);
  }

  return environment;
};
