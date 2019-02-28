const { promisify } = require('util');
const hostile = require('hostile');
const { red, yellow, bold } = require('chalk');

const { hosts, sites } = require('../context');
const suggestScript = require('./suggestScript');

const setSystemHost = promisify(hostile.set);
const getSystemHosts = promisify(hostile.get);

const getAppHosts = () =>
  sites
    .filter(site => site.host)
    .map(site => site.host)
    .concat(hosts);

const setupHosts = async () => {
  try {
    const appHosts = getAppHosts().filter(host => host !== 'localhost');

    for (let i = 0; i < appHosts.length; i++) {
      const host = appHosts[i];

      await setSystemHost('127.0.0.1', host);
      console.log(`Sucessfully added '${bold(host)}' to your hosts file`);
    }
  } catch (e) {
    if (e.code === 'EACCES') {
      console.log(red('Error: setup-hosts must be run with root privileges'));
    } else {
      console.error(e);
    }

    throw e;
  }
};

const checkHosts = async () => {
  try {
    const systemHosts = await getSystemHosts(false);
    const appHosts = getAppHosts();

    const missingHosts = appHosts.filter(
      appHost => !systemHosts.find(([_, host]) => appHost === host),
    );

    if (missingHosts.length > 0) {
      missingHosts.forEach(appHost => {
        console.log(
          yellow(
            `Host '${bold(appHost)}' is not configured in your hosts file`,
          ),
        );
      });

      await suggestScript('setup-hosts', { sudo: true });
    }
  } catch (e) {
    // swallow error as this just a warning check
  }
};

module.exports = {
  setupHosts,
  checkHosts,
  getAppHosts,
};
