const path = require('path');
const fs = require('fs');

const runBin = require('./runBin');
const builds = require('../config/builds');

module.exports = () => {
  const tsConfig = {
    extends: require.resolve('../config/typescript/tsconfig.json'),
    include: builds.reduce((acc, { paths }) => [...acc, ...paths.src], []),
    exclude: [path.join(process.cwd(), 'node_modules')]
  };
  const outPath = path.join(process.cwd(), 'tsconfig.json');

  fs.writeFileSync(outPath, JSON.stringify(tsConfig));

  return runBin({
    packageName: 'typescript',
    binName: 'tsc',
    args: ['--project', process.cwd(), '--noEmit'],
    options: { stdio: 'inherit' }
  });
};
