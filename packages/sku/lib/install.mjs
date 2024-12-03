// @ts-check
import { getAddCommand } from './packageManager.js';

import { spawn } from 'cross-spawn';

/**
 * @param {import("./packageManager.js").GetAddCommandOptions} options
 * @returns {Promise<void>}
 */
export default ({ deps, type, logLevel, exact = true }) =>
  new Promise((resolve, reject) => {
    const addCommand = getAddCommand({ deps, type, logLevel, exact });
    const [command, ...args] = addCommand.split(' ');

    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', (code) => (code === 0 ? resolve() : reject()));
  });
