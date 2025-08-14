import { makeStableViteHashes } from '@sku-private/test-utils';

export default {
  __UNSAFE_EXPERIMENTAL__testRunner: 'vitest',
  setupTests: ['./setup-test.ts'],
  __UNSAFE_EXPERIMENTAL__dangerouslySetViteConfig: makeStableViteHashes,
};
