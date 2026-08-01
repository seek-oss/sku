import { defineServerEntry } from 'sku/ssr';

/** Realistic production middleware — health check before HTML render. */
const server = defineServerEntry({
  middleware: [
    (req, res, next) => {
      if (req.path === '/api/health') {
        res.status(200).type('text/plain').send('ok');
        return;
      }
      next();
    },
  ],
});

export default server;
