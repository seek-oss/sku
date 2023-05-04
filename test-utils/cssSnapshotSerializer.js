const prettier = require('prettier');
const css = require('css');

const cssSnapshotSerializer = {
  print: (value) => prettier.format(value, { parser: 'css' }),
  test: (value) => {
    try {
      css.parse(value);
    } catch (e) {
      return false;
    }
    return true;
  },
};

module.exports = cssSnapshotSerializer;
