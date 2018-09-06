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

module.exports = args => {
  // Remove node
  args.shift();

  if (args[0].match(/bin\/sku(\.js)?/)) {
    args.shift();
  }

  const options = commandLineArgs(optionDefinitions, {
    argv: args,
    stopAtFirstUnknown: true,
    partial: true
  });

  let { scriptName, _unknown: argv = [] } = options;

  const scriptNameRegex = /scripts[\/\\]([\w-]*)\.js$/i;
  const scriptInvocation = scriptName.match(scriptNameRegex);

  if (scriptInvocation && scriptInvocation.length) {
    scriptName = scriptInvocation[1];
    argv = process.argv.slice(2);
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
