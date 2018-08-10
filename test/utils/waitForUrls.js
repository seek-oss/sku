const { promisify } = require('es6-promisify');
const waitOnAsync = promisify(require('wait-on'));

module.exports = async (...urls) => {
  const timeout = 40000;

  try {
    return await waitOnAsync({
      resources: urls.map(url => url.replace(/^http/, 'http-get')),
      headers: { accept: 'text/html, application/javascript' },
      timeout
    });
  } catch (error) {
    if (error.message === 'Timeout') {
      throw new Error(`waitForUrls waited ${timeout}ms for ${urls.join(', ')}`);
    }

    throw error;
  }
};
