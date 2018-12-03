const { runBin } = require('./runBin');
const { cwd } = require('./cwd');

module.exports = (pathsToCheck = []) =>
  runBin({
    packageName: 'tslint',
    args: ['--project', cwd(), ...pathsToCheck],
    options: { stdio: 'inherit' }
  });
