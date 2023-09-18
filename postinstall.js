const { writeFileSync } = require('node:fs');
const {
  volta: { node: nodeVersion },
} = require('./package.json');

writeFileSync('./.nvmrc', `${nodeVersion}\n`);
