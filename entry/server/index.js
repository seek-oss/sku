import fs from 'fs';
import http from 'http';
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

(async () => {
  if (module.hot) {
    if (fs.existsSync(__SKU_SKU_CONFIG_PATH__)) {
      const { devServerMiddleware } = require(__SKU_SKU_CONFIG_PATH__);
      if (devServerMiddleware) {
        devServerMiddleware(app);
      }
    }
    const server = (() => {
      if (__SKU_DEV_HTTPS__) {
        const pems = fs.readFileSync('.ssl/self-signed.pem');
        return require('https').createServer(
          {
            cert: pems,
            key: pems,
          },
          app,
        );
      }
      return http.createServer(app);
    })();
    let currentApp = app;
    server.listen(port, startCallback);
    module.hot.accept('./server', () => {
      server.removeListener('request', currentApp);
      server.on('request', app);
      currentApp = app;
    });
  } else {
    app.listen(port, startCallback);
  }
})();
