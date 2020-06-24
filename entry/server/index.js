import commandLineArgs from 'command-line-args';
import { app, onStart } from './server';
import createServer from '../../lib/createServer';

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
    const server = await createServer(app);
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
