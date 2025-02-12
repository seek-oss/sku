import chalk from 'chalk';
import getPort from 'get-port';
import _debug from 'debug';

const debug = _debug('sku:allocatePort');

const allocatePort = async ({
  port,
  host,
}: {
  port?: number;
  host?: string;
}) => {
  debug(`Finding available port with request for ${port}`);
  const actualPort = await getPort({ port, host });

  if (port !== actualPort) {
    console.log(
      chalk.yellow(
        `Warning: Requested port ${chalk.bold(
          port,
        )} is unavailable. Falling back to ${chalk.bold(actualPort)}.`,
      ),
    );
  }

  return actualPort;
};

export default allocatePort;
