const { Option } = require('commander');
const statsOption = new Option(
  '-s, --stats <preset>',
  'Webpack stats presets',
).choices([
  'errors-only',
  'errors-warnings',
  'minimal',
  'none',
  'normal',
  'verbose',
  'detailed',
  'summary',
]);

module.exports = statsOption;
