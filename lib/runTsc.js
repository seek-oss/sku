const { runBin } = require('./runBin');
const { cwd } = require('./cwd');

module.exports = () =>
  runBin({
    packageName: 'typescript',
    binName: 'tsc',
    args: ['--project', cwd(), '--noEmit'],
    options: { stdio: 'inherit' },
  });
