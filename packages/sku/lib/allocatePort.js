const { yellow, bold } = require('chalk');
const getPort = require('get-port');
const debug = require('debug')('sku:allocatePort');

/**
 * @param {{port?: number, host?: string}}
 * */
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

module.exports = allocatePort;
