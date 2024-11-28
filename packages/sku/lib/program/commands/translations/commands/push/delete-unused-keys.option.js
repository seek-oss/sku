const { Option } = require('commander');

const deleteUnusedKeysOption = new Option(
  '--delete-unused-keys',
  'delete unused keys',
).default(false);

module.exports = deleteUnusedKeysOption;
