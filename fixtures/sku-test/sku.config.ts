import { makeStableViteHashes } from '@sku-private/test-utils';

export default {
  setupTests: ['./setup-test.ts'],
  dangerouslySetViteConfig: makeStableViteHashes,
};
