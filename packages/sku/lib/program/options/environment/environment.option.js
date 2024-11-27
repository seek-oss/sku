const { Option } = require('commander');
const environmentOption = new Option(
  '-e, --environment [environment]',
  'program environment to run in',
);

module.exports = environmentOption;
