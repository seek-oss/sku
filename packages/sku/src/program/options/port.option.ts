import { Option } from 'commander';

export const portOption = new Option(
  '--port [port]',
  'Port to serve on',
).argParser(Number);

export const strictPortOption = new Option(
  '--strict-port',
  'Fail if the requested port is unavailable',
).default(false);
