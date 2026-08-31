import { describe, expect, it } from 'vitest';

import { normaliseClientContext } from './normaliseClientContext.js';

describe('normaliseClientContext', () => {
  it('drops undefined object keys', () => {
    expect(
      normaliseClientContext({ theme: 'dark', userId: undefined }),
    ).toEqual({ theme: 'dark' });
  });

  it('coerces undefined array elements to null', () => {
    expect(normaliseClientContext({ tags: [undefined, 'a'] })).toEqual({
      tags: [null, 'a'],
    });
  });

  it('leaves top-level undefined unchanged', () => {
    expect(normaliseClientContext(undefined)).toBeUndefined();
  });

  it('leaves explicit null unchanged', () => {
    expect(normaliseClientContext(null)).toBeNull();
  });
});
