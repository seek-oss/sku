module.exports = {
  port: 9843,
  serverPort: 9894,
  useHttpsDevServer: true,
  devServerMiddleware: (app) => {
    app.get('/test-middleware', (_, res) => {
      res.status(200).send('OK');
    });
  },
  target: 'dist-build',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
};
