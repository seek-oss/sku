const glob = require('fast-glob');
const { cwd } = require('./cwd');

module.exports = () => {
  const tsFiles = glob.sync(['**/*.{ts,tsx}', '!**/node_modules/**'], {
    cwd: cwd()
  });
  return tsFiles.length > 0;
};
