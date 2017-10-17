import http from 'http';
import app from './server';
const port = process.env.SKU_PORT || 8080;

if (module.hot) {
  const server = http.createServer(app);
  let currentApp = app;
  server.listen(port);
  module.hot.accept('./server', () => {
    server.removeListener('request', currentApp);
    server.on('request', app);
    currentApp = app;
  });
} else {
  app.listen(port, () => {
    console.log(`App started on port ${port}`);
  });
}
