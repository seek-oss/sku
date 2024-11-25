module.exports = (app) => {
  app.get(
    '/test-middleware',
    /**
     * @param {unknown} _
     * @param {import('node:http').ServerResponse} res
     */
    (_, res) => {
      res.statusCode = 200;
      res.end('OK');
    },
  );
};
