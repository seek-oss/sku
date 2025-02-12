import {
  createServer as createHttpServer,
  type RequestListener,
} from 'node:http';
import { createServer as createHttpsServer } from 'node:https';

import getCertificate from './certificate.js';
import type { SkuContext } from '@/context/createSkuContext.js';

const createServer = async ({
  requestListener,
  httpsDevServer,
  hosts,
}: {
  requestListener: RequestListener;
  httpsDevServer: boolean;
  hosts: SkuContext['hosts'];
}) => {
  if (!httpsDevServer) {
    return createHttpServer(requestListener);
  }

  const pems = await getCertificate('.ssl', hosts);

  return createHttpsServer({ key: pems, cert: pems }, requestListener);
};

export default createServer;
