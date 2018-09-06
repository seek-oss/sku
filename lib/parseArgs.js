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
 * [node, scripts/foo.js, arg1, arg2]
 * [node, sku, foo, arg1, arg2]
 *
 * @param {String[]} args - should look like process.argv
 */
module.exports = _args => {
  const args = [..._args];

  // The first argv is always the node executable, which we don't care about.
  args.shift();

  // If you're running `sku something` then the next arg is the sku executable, which we don't
  // care about either.
  if (args[0].match(/bin\/sku(\.js)?/)) {
    args.shift();
  }

  // At this point, args should be either
  // [script/foo.js, arg1, arg2] or
  // [foo, arg1, arg2]
  const options = commandLineArgs(optionDefinitions, {
    argv: args,
    stopAtFirstUnknown: true,
    partial: true
  });

  let { scriptName } = options;

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
    argv: options._unknown || []
  };
};
