import { makeStableViteHashes } from '@sku-private/test-utils';

export default {
  testRunner: 'vitest',
  setupTests: ['./setup-test.vitest.ts'],
  dangerouslySetViteConfig: makeStableViteHashes,
};
