import { getAddCommand, type GetAddCommandOptions } from './packageManager.js';

import { spawn } from 'cross-spawn';

export default ({
  deps,
  type,
  logLevel,
  exact = true,
}: GetAddCommandOptions): Promise<void> =>
  new Promise((resolve, reject) => {
    const addCommand = getAddCommand({ deps, type, logLevel, exact });
    const [command, ...args] = addCommand.split(' ');

    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', (code) => (code === 0 ? resolve() : reject()));
  });
