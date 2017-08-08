const commandLineArgs = require('command-line-args');

const scriptNameRegex = /scripts[\/\\]([\w-]*)\.js$/i;
const scriptName = process.argv[1].match(scriptNameRegex)[1];

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
