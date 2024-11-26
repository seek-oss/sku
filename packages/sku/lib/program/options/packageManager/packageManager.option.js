const { Option } = require('commander');
const packageManagerOption = new Option(
  '-p, --packageManager [type]',
  'PackageManager to use',
);

module.exports = packageManagerOption;
