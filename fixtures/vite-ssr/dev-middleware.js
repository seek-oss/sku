/** Dev-only mocks for Vite SSR `sku start`. Must not ship in the production server. */
export default (app) => {
  app.get('/mock-api', (_req, res) => {
    res.status(200).type('text/plain').send('sku-vite-ssr-dev-mock');
  });
};
