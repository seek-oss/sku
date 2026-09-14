import { defineServerEntry } from 'sku/runtime';

const server = defineServerEntry({
  getSite({ req }) {
    return req.hostname === 'jobstreet.com.localhost' ? 'jobStreet' : 'seekAnz';
  },
});

export default server;
