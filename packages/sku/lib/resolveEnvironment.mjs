// @ts-check
import { environments } from '../context';
import { bold, red } from 'chalk';

/**
 * @param {{environment?: string}} options
 */
export const resolveEnvironment = ({ environment: environmentOption }) => {
  const environment = environmentOption || environments?.[0] || '';

  if (environment) {
    if (!environments?.includes(environment)) {
      console.log(red(`Unknown environment: ${bold(environment)}`));
      process.exit(1);
    }

    console.log(`Using ${bold(environment)} environment`);
  }

  return environment;
};
