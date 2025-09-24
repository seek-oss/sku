export default (server) => {
  server.use('/test-middleware', (req, res, next) => {
    if (req.method !== 'GET') {
      next();
    }
    res.end('OK');
  });
};
