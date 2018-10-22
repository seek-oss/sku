const path = require('path');
const fs = require('fs');

const runBin = require('./runBin');
const tslintConfig = require('../config/typescript/tslint.json');

module.exports = () => {
  const outPath = path.join(process.cwd(), 'tslint.json');

  fs.writeFileSync(outPath, JSON.stringify(tslintConfig));

  return runBin({
    packageName: 'tslint',
    args: ['--project', process.cwd()],
    options: { stdio: 'inherit' }
  });
};
