module.exports = {
  port: 9843,
  useHttpsDevServer: true,
  devServerMiddleware: (app) => {
    app.get('/test-middleware', (_, res) => {
      res.status(200).send('OK');
    });
  },
};
