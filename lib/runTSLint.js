const runBin = require('./runBin');

module.exports = () =>
  runBin({
    packageName: 'tslint',
    args: ['--project', process.cwd()],
    options: { stdio: 'inherit' }
  });
