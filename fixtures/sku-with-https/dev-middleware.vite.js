module.exports = (app) => {
  app.middlewares.use('/test-middleware', (req, res, next) => {
    if (req.method !== 'GET') {
      next();
    }
    res.status(200).send('OK');
  });
};
