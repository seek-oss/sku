const { Option } = require('commander');
const environmentOption = new Option(
  '-e, --environment [environment]',
  'Node environment to run in',
);

module.exports = environmentOption;
