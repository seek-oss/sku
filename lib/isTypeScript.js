const glob = require('fast-glob');

module.exports = (cwd = process.cwd()) => {
  const tsFiles = glob.sync(['**/*.{ts,tsx}', '!**/node_modules/**'], {
    cwd
  });
  return tsFiles.length > 0;
};
