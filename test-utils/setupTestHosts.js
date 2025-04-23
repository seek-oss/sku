// @ts-check
import { promisify } from 'node:util';
import { set } from 'hostile';

const setSystemHost = promisify(set);

const hosts = ['dev.seek.com.au', 'dev.jobstreet.com'];

for (const host of hosts) {
  await setSystemHost('127.0.0.1', host);
  await setSystemHost('::1', host);
}
