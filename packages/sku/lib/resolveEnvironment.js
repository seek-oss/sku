// @ts-check
const { environments } = require('../context');
const { bold, red } = require('chalk');
const program = require('./program');

module.exports = () => {
  const environment = program.opts()?.environment
    ? program.opts()?.environment
    : environments?.[0] || '';

  if (environment) {
    if (!environments?.includes(environment)) {
      console.log(red(`Unknown environment: ${bold(environment)}`));
      process.exit(1);
    }

    console.log(`Using ${bold(environment)} environment`);
  }

  return environment;
};
