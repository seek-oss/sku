const { Option } = require('commander');
const configOption = new Option(
  '-c, --config [config]',
  'Path to your sku.config.js file',
);

module.exports = configOption;
