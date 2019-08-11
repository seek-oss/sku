const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  {
    name: 'script',
    defaultOption: true,
  },
  {
    name: 'env',
    alias: 'e',
    type: String,
    defaultValue: 'production',
  },
  {
    name: 'tenant',
    alias: 't',
    type: String,
    defaultValue: '',
  },
  {
    name: 'build',
    alias: 'b',
    type: String,
  },
  {
    name: 'config',
    alias: 'c',
    type: String,
    defaultValue: 'sku.config.js',
  },
  {
    name: 'debug',
    alias: 'D',
    type: Boolean,
  },
];

/**
 * Supports parsing args that look like:
 * [/path/to/node/node, /path/to/sku, scriptName, arg1, arg2]
 *
 * @param {String[]} args - should look like process.argv
 */
module.exports = args => {
  const options = commandLineArgs(optionDefinitions, {
    // The first 2 items in process.argv are /path/to/node and /path/to/sku.
    // We need the first arg we give to command-line-args to be the script name.
    argv: args.slice(2),
    stopAtFirstUnknown: false,
    partial: true,
  });

  const { script, _unknown: argv = [] } = options;

  // Backwards compatibility for unnamed build name argument, to be deprecated
  const buildName = () => {
    if (options.build) {
      return options.build;
    } else if (argv.length) {
      return argv[0];
    }
    return undefined; // eslint-disable-line no-undefined
  };

  return {
    ...options,
    buildName: script === 'start' ? buildName() : null,
    env: script === 'start' ? 'development' : options.env,
    argv,
  };
};
