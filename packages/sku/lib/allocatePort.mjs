// @ts-check
import { yellow, bold } from 'chalk';
import getPort from 'get-port';
const debug = require('debug')('sku:allocatePort');

/**
 * @param {{ port?: number, host?: string }} options
 */
const allocatePort = async ({ port, host }) => {
  debug(`Finding available port with request for ${port}`);
  const actualPort = await getPort({ port, host });

  if (port !== actualPort) {
    console.log(
      yellow(
        `Warning: Requested port ${bold(
          port,
        )} is unavailable. Falling back to ${bold(actualPort)}.`,
      ),
    );
  }

  return actualPort;
};

export default allocatePort;
