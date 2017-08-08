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
  }
];

const options = commandLineArgs(optionDefinitions);

module.exports = {
  script: scriptName,
  buildName: scriptName === 'start' ? process.argv[2] : null,
  env: scriptName === 'start' ? 'development' : options.env,
  tenant: options.tenant
};
