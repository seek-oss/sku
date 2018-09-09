const chalk = require('chalk');
const commandLineArgs = require('command-line-args');
const path = require('path');

const optionDefinitions = [
  {
    name: 'scriptName',
    defaultOption: true
  },
  {
    name: 'env',
    alias: 'e',
    type: String,
    defaultValue: 'production'
  },
  {
    name: 'tenant',
    alias: 't',
    type: String,
    defaultValue: ''
  },
  {
    name: 'build',
    alias: 'b',
    type: String
  },
  {
    name: 'config',
    alias: 'c',
    type: String,
    defaultValue: 'sku.config.js'
  }
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
    stopAtFirstUnknown: true,
    partial: true
  });

  let { scriptName, _unknown: argv = [] } = options;

  // Detect if you're trying to execute a script directly...
  const scriptNameRegex = /scripts[\/\\]([\w-]*)\.js$/i;
  const scriptInvocation = scriptName.match(scriptNameRegex);

  // ...and if you are, update scriptName accordingly.
  if (scriptInvocation && scriptInvocation.length) {
    scriptName = scriptInvocation[1];
  }

  //Backwards compatibility for unnamed build name argument, to be deprecated
  const buildName = () => {
    if (options.build) {
      return options.build;
    } else if (argv.length) {
      return argv[0];
    }
  };

  return {
    script: scriptName,
    buildName: scriptName === 'start' ? buildName() : null,
    env: scriptName === 'start' ? 'development' : options.env,
    tenant: options.tenant,
    config: options.config,
    argv
  };
};
