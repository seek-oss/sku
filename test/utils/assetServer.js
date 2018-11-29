const path = require('path');
const { startBin } = require('../../lib/runBin');

const configLocation = require.resolve('./assetServerConfig.json');

module.exports = (port, targetDirectory) => {
  const config = path.relative(targetDirectory, configLocation);

  const server = startBin({
    packageName: 'serve',
    args: ['--listen', port, '--config', config],
    options: { cwd: targetDirectory }
  });

  return () => server.kill();
};
