import _getPort, { portNumbers } from 'get-port';

export async function getPort() {
  return await _getPort({ port: portNumbers(4000, 4100) });
}
