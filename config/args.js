const commandLineArgs = require('command-line-args');

const scriptNameRegex = /scripts[\/\\]([\w-]*)\.js$/i;
const scriptNameByRegex = process.argv[1].match(scriptNameRegex);

const scriptName = scriptNameByRegex
  ? scriptNameByRegex[1]
  : process.argv[1].substring(process.argv[1].lastIndexOf('/') + 1); //Invoked by cross-spawn rather than CLI

const optionDefinitions = [
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
  }
];

const options = commandLineArgs(optionDefinitions, { partial: true });

//Backwards compatibility for unnamed build name argument, to be deprecated
const buildName = () => {
  if (options.build) {
    return options.build;
  } else if (options._unknown && options._unknown.length > 0) {
    return options._unknown[0];
  }
};

module.exports = {
  script: scriptName,
  buildName: scriptName === 'start' ? buildName() : null,
  env: scriptName === 'start' ? 'development' : options.env,
  tenant: options.tenant
};
