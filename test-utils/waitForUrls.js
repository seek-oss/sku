import waitOn from 'wait-on';

export const waitForUrls = async (...urls) => {
  const timeout = 200000;

  try {
    return await waitOn({
      resources: urls.map((url) =>
        url
          .replace(/http(s?)\:/, 'http$1-get:')
          // As of node 17, ipv6 is preferred, so explicitly use ipv4
          // See https://github.com/jeffbski/wait-on/issues/133
          .replace(/localhost/, '0.0.0.0'),
      ),
      headers: { accept: 'text/html, application/javascript' },
      timeout,
      // Log output of wait behaviour timing to allow
      // increased debugging when service fails to start
      log: false,
      strictSSL: false,
    });
  } catch (error) {
    if (error.message === 'Timeout') {
      throw new Error(`waitForUrls waited ${timeout}ms for ${urls.join(', ')}`);
    }

    throw error;
  }
};
