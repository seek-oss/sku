const commandLineArgs = require('command-line-args');

const optionDefinitions = [
  {
    name: 'script',
    defaultOption: true,
  },
  {
    name: 'config',
    alias: 'c',
    type: String,
  },
  {
    name: 'debug',
    alias: 'D',
    type: Boolean,
  },
  {
    name: 'environment',
    type: String,
  },
  {
    name: 'packageManager',
    type: String,
  },
  {
    name: 'port',
    type: Number,
  },
  {
    name: 'site',
    type: String,
  },
  {
    name: 'stats',
    type: String,
  },
];

/**
 * Supports parsing args that look like:
 * [/path/to/node/node, /path/to/sku, scriptName, arg1, arg2]
 *
 * @param {string[]} args - should look like process.argv
 */
module.exports = (args) => {
  const options = commandLineArgs(optionDefinitions, {
    // The first 2 items in process.argv are /path/to/node and /path/to/sku.
    // We need the first arg we give to command-line-args to be the script name.
    argv: args.slice(2),
    stopAtFirstUnknown: false,
    partial: true,
  });

  const { _unknown: argv = [] } = options;

  return {
    ...options,
    argv,
  };
};
