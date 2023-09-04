const args = require('../config/args');

/**
 * Stringify the values of an object of environment variables, prepending keys with
 * `process.env.` in the process
 * @param {Record<string, unknown>} envars An object of environment variables and their values
 */
const stringifyEnvarValues = (envars) => {
  const entries = Object.entries(envars);

  const stringifiedEntries = entries.map(([key, value]) => {
    const newKey = `process.env.${key}`;

    if (typeof value !== 'object') {
      return [newKey, JSON.stringify(value)];
    }

    if (typeof value === 'undefined') {
      console.log(
        `WARNING: Environment variable "${key}" is missing a value for the "${args.env}" environment`,
      );
      process.exit(1);
    }

    return [newKey, JSON.stringify(value)];
  });

  return Object.fromEntries(stringifiedEntries);
};

module.exports = { stringifyEnvarValues };
