import fs from 'fs';
import http from 'http';
import https from 'https';
import commandLineArgs from 'command-line-args';
import { app, onStart } from './server';

const { port } = commandLineArgs(
  [
    {
      name: 'port',
      alias: 'p',
      type: Number,
      defaultValue: __SKU_DEFAULT_SERVER_PORT__, // eslint-disable-line no-undef
    },
  ],
  { partial: true },
);

const startCallback = () => {
  console.log(`App started on port ${port}`);

  if (typeof onStart === 'function') {
    onStart(app);
  }
};

if (__SKU_DEV_MIDDLEWARE_ENABLED__) {
  const devServerMiddleware = require(__SKU_DEV_MIDDLEWARE_PATH__);
  if (devServerMiddleware && typeof devServerMiddleware === 'function') {
    devServerMiddleware(app);
  }
}

let server;

if (__SKU_DEV_HTTPS__) {
  const pems = fs.readFileSync('.ssl/self-signed.pem');
  server = https.createServer(
    {
      cert: pems,
      key: pems,
    },
    app,
  );
} else {
  server = http.createServer(app);
}

server.listen(port, startCallback);
