const { Option } = require('commander');
const configOption = new Option(
  '-c, --config [config]',
  'Path to your sku config file',
);

module.exports = configOption;
