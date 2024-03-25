import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import { app, onStart } from './server';
import minimist from 'minimist';

const { port } = minimist(process.argv.slice(2), {
  alias: { p: 'port' },
  // eslint-disable-next-line no-undef
  default: { port: __SKU_DEFAULT_SERVER_PORT__ },
});

const startCallback = () => {
  console.log('Server started on port', port);

  if (typeof onStart === 'function') {
    onStart(app);
  }
};

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

if (import.meta.webpackHot) {
  process.on('message', () => {
    if (import.meta.webpackHot.status() === 'idle') {
      import.meta.webpackHot.check(true);
    }
  });

  let currentApp = app;

  import.meta.webpackHot.accept('./server', () => {
    server.removeListener('request', currentApp);
    server.on('request', app);
    currentApp = app;
    console.log('Server hot reloaded');
  });
}
