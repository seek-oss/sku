import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { app, onStart } from './server.js';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: {
      type: 'string',
      short: 'p',
      default: `${__SKU_DEFAULT_SERVER_PORT__}`,
    },
  },
  allowPositionals: true,
  strict: false,
});

const { port } = values;

let server: http.Server;

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

server.listen(port, async () => {
  console.log('sku SSR server started on port', port);

  if (typeof onStart !== 'function') {
    return;
  }

  try {
    await onStart(app, {
      httpServer: server,
      port: Number(port),
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});

if (import.meta.webpackHot) {
  process.on('message', () => {
    if (import.meta.webpackHot.status() === 'idle') {
      import.meta.webpackHot.check(true);
    }
  });

  let currentApp = app;

  import.meta.webpackHot.accept(
    '../services/webpack/entry/server/server.mjs',
    () => {
      server.removeListener('request', currentApp);
      server.on('request', app);
      currentApp = app;
      console.log('Server hot reloaded');
    },
  );
}
