const glob = require('glob');

const tsFiles = glob.sync('**/*.{ts,tsx}', {
  cwd: process.cwd(),
  ignore: 'node_modules'
});
const isTypeScript = tsFiles.length > 0;

module.exports = isTypeScript;
