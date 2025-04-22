import _getPort from 'get-port';

/**
 * List of recently used ports to avoid collisions
 * when starting tests in parallel.
 */
const usedPorts: number[] = [];

export async function getPort() {
  const port = await _getPort({ exclude: usedPorts });
  usedPorts.push(port);
  return port;
}
