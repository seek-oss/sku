const { static: expressStatic } = require('express');

module.exports = (app) => {
  app.get('/test-middleware', (_, res) => {
    res.status(200).send('OK');
  });

  app.use('/assets', expressStatic('./assets'));
};
