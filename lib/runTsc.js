const path = require('path');
const fs = require('fs');
const spawnPromise = require('./spawnPromise');
const resolveBin = require('./resolveBin');

module.exports = () => {
  const tscPath = resolveBin('typescript', 'tsc');

  const tscOptions = ['--project', process.cwd(), '--noEmit'];

  const tsConfig = {
    extends: require.resolve('../config/typescript/tsconfig.json'),
    include: [path.join(process.cwd(), 'src/**/*')],
    exclude: [path.join(process.cwd(), 'node_modules')]
  };
  const outPath = path.join(process.cwd(), 'tsconfig.json');

  fs.writeFileSync(outPath, JSON.stringify(tsConfig));

  return spawnPromise(tscPath, tscOptions, { stdio: 'inherit' });
};
