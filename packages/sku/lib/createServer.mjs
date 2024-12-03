// @ts-check
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';

import { httpsDevServer } from '../context/index.js';
import getCertificate from './certificate.mjs';

/**
 * @param {import("http").RequestListener} requestListener
 */
const createServer = async (requestListener) => {
  if (!httpsDevServer) {
    return createHttpServer(requestListener);
  }

  const pems = await getCertificate();

  return createHttpsServer({ key: pems, cert: pems }, requestListener);
};

export default createServer;
