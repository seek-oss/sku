const { promisify } = require('util');
const hostile = require('hostile');

const setSystemHost = promisify(hostile.set);

const hosts = ['dev.seek.com.au', 'dev.jobstreet.com'];

(async () => {
  for (const host of hosts) {
    await setSystemHost('127.0.0.1', host);
  }
})();
