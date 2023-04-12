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
