const { environments } = require('../context');
const args = require('../config/args');
const { bold, red } = require('chalk');

module.exports = () => {
  const environment = args.environment
    ? args.environment
    : environments[0] || '';

  if (environment) {
    if (environments.indexOf(environment) === -1) {
      console.log(red(`Unknown environment: ${bold(environment)}`));
      process.exit(1);
    }

    console.log(`Using ${bold(environment)} environment`);
  }

  return environment;
};
