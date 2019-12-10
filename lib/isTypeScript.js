const glob = require('fast-glob');
const { cwd } = require('./cwd');
const debug = require('debug')('sku:isTypeScript');

const tsFiles = glob.sync(['**/*.{ts,tsx}', '!**/node_modules/**'], {
  cwd: cwd(),
});
const isTypeScript = tsFiles.length > 0;

if (isTypeScript) {
  debug(
    `Found TypeScript in project. Found ${tsFiles.length} with the first at "${tsFiles[0]}".`,
  );
}

module.exports = isTypeScript;
