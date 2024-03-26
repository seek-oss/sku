// @ts-check
const http = require('node:http');
const https = require('node:https');

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
