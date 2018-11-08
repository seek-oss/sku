const { promisify } = require('util');
const waitOnAsync = promisify(require('wait-on'));

module.exports = async (...urls) => {
  const timeout = 80000;

  try {
    return await waitOnAsync({
      resources: urls.map(url => url.replace(/^http/, 'http-get')),
      headers: { accept: 'text/html, application/javascript' },
      timeout,
      // Log output of wait behaviour timing to allow
      //  increased debugging when service fails to start
      log: true
    });
  } catch (error) {
    if (error.message === 'Timeout') {
      throw new Error(`waitForUrls waited ${timeout}ms for ${urls.join(', ')}`);
    }

    throw error;
  }
};
