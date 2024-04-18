const { prettierDecorator } = require('../../context');

const baseConfig = {
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
};

module.exports = prettierDecorator(baseConfig);
