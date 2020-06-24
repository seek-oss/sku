const http = require('http');
const https = require('https');

const { useHttpsDevServer } = require('../context');
const getCertificate = require('./certificate');

const createServer = async (requestListener) => {
  if (!useHttpsDevServer) {
    return http.createServer(requestListener);
  }

  const pems = await getCertificate();

  return https.createServer({ key: pems, cert: pems }, requestListener);
};

module.exports = createServer;
