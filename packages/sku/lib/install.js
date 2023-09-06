const { getAddCommand } = require('./packageManager');

const spawn = require('cross-spawn');

/**
 * @param {import("../lib/packageManager").GetAddCommandOptions} options
 */
module.exports = ({ deps, type, logLevel, exact = true }) =>
  new Promise((resolve, reject) => {
    const addCommand = getAddCommand({ deps, type, logLevel, exact });
    const [command, ...args] = addCommand.split(' ');

    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', (code) => (code === 0 ? resolve() : reject()));
  });
