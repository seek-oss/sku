const spawn = require('cross-spawn');

module.exports = (deps, verbose, useYarn) =>
  new Promise((resolve, reject) => {
    const command = useYarn ? 'yarnpkg' : 'npm';

    const args = useYarn
      ? ['add', '--exact', ...deps]
      : ['install', '--save', '--save-exact', '--loglevel', 'error', ...deps];

    if (verbose) {
      args.push('--verbose');
    }

    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', code => (code === 0 ? resolve() : reject()));
  });
