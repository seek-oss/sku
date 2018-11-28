const { startBin } = require('../../lib/runBin');

module.exports = (port, targetDirectory) => {
  const server = startBin({
    packageName: 'serve',
    args: ['-l', `tcp://localhost:${port}`],
    options: { cwd: targetDirectory }
  });

  return () => server.kill();
};
