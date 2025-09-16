import { GET_PRODUCTS } from '@sku-private/3rd-party-cjs-interop-dep';
import { describe, expect, it } from 'vitest';

import { GET_USERS } from './graphql';

// The imports are the real tests, these are just here so we have some tests to run
describe('cjs interop', () => {
  it('should handle cjs interop for a direct dependency', () => {
    expect(GET_USERS).toBeDefined();
  });

  it('should handle cjs interop for a transitive dependency', () => {
    expect(GET_PRODUCTS).toBeDefined();
  });
});
