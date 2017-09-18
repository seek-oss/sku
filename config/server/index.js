import http from 'http';
import app from './server';
const port = process.env.PORT || 8080;

const server = http.createServer(app);
let currentApp = app;
server.listen(port);

if (module.hot) {
  module.hot.accept('./server', () => {
    server.removeListener('request', currentApp);
    server.on('request', app);
    currentApp = app;
  });
}
