const { Option } = require('commander');
const debugOption = new Option('-d, --debug', 'Enable debug logging.').default(
  false,
);

module.exports = debugOption;
