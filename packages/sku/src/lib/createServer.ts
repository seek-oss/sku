import {
  createServer as createHttpServer,
  type RequestListener,
} from 'node:http';
import { createServer as createHttpsServer } from 'node:https';

import { httpsDevServer } from '../context/index.js';
import getCertificate from './certificate.js';

const createServer = async (requestListener: RequestListener) => {
  if (!httpsDevServer) {
    return createHttpServer(requestListener);
  }

  const pems = await getCertificate();

  return createHttpsServer({ key: pems, cert: pems }, requestListener);
};

export default createServer;
