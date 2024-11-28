const { Option } = require('commander');
const packageManagerOption = new Option(
  '-p, --package-manager [type]',
  'Package manager to use when installing dependencies',
);

module.exports = packageManagerOption;
