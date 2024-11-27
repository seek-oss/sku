const { Option } = require('commander');
const packageManagerOption = new Option(
  '-p, --packageManager [type]',
  'Package manager to use when installing dependencies',
);

module.exports = packageManagerOption;
