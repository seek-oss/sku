const http = require('http');
const https = require('https');

const { httpsDevServer } = require('../context');
const getCertificate = require('./certificate');

/**
 * @param {import("http").RequestListener} requestListener
 */
const createServer = async (requestListener) => {
  if (!httpsDevServer) {
    return http.createServer(requestListener);
  }

  const pems = await getCertificate();

  return https.createServer({ key: pems, cert: pems }, requestListener);
};

module.exports = createServer;
