const glob = require('fast-glob');

const tsFiles = glob.sync(['**/*.{ts,tsx}', '!**/node_modules/**']);
const isTypeScript = tsFiles.length > 0;

module.exports = isTypeScript;
