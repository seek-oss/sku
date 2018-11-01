const runBin = require('./runBin');
const { cwd } = require('./cwd');

module.exports = () =>
  runBin({
    packageName: 'tslint',
    args: ['--project', cwd],
    options: { stdio: 'inherit' }
  });
