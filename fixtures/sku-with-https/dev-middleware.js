module.exports = (app) => {
  app.get('/test-middleware', (_, res) => {
    res.status(200).send('OK');
  });
};
