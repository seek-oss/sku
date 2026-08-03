import { promisify } from 'node:util';
import { set } from 'hostile';

const setSystemHost = promisify(set);

const hosts = ['au.seek.com.localhost', 'jobstreet.com.localhost'];

for (const host of hosts) {
  await setSystemHost('127.0.0.1', host);
  await setSystemHost('::1', host);
}
