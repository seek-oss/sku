import { describe, expect, it } from 'vitest';
import type { StaticHandlerContext } from 'react-router';

import { getStaticContextFromError } from './getStaticContextFromError.js';

describe('getStaticContextFromError', () => {
  it('rethrows when no error boundary id exists', () => {
    const error = new Error('no boundary');
    expect(() =>
      getStaticContextFromError(
        [],
        { matches: [] } as unknown as StaticHandlerContext,
        error,
      ),
    ).toThrow(error);
  });
});
