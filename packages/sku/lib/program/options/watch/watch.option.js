const { Option } = require('commander');
const watchOption = new Option('-w, --watch', 'Watch for changes').default(
  false,
);

module.exports = watchOption;
