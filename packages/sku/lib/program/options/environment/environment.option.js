const { Option } = require('commander');
const environmentOption = new Option(
  '-e, --environment [environment]',
  'Node environment to run in',
).choices(['development', 'production', 'test']);

module.exports = environmentOption;
