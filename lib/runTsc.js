const runBin = require('./runBin');

module.exports = () =>
  runBin({
    packageName: 'typescript',
    binName: 'tsc',
    args: ['--project', process.cwd(), '--noEmit'],
    options: { stdio: 'inherit' }
  });
