const spawn = require('cross-spawn');

module.exports = ({ deps, type, exact = true, verbose, useYarn }) =>
  new Promise((resolve, reject) => {
    const command = useYarn ? 'yarnpkg' : 'npm';
    const isDev = type === 'dev';

    const args = useYarn
      ? [
          'add',
          isDev ? '--dev' : null,
          exact ? '--exact' : null,
          ...deps,
        ].filter(arg => arg !== null)
      : [
          'install',
          `--save${isDev ? '-dev' : ''}`,
          exact ? '--save-exact' : null,
          '--loglevel',
          'error',
          ...deps,
        ].filter(arg => arg !== null);

    if (verbose) {
      args.push('--verbose');
    }

    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', code => (code === 0 ? resolve() : reject()));
  });
