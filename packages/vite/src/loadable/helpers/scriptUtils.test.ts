import { describe, expect, it } from 'vitest';
import { createScriptTag } from './scriptUtils.js';

describe('createScriptTag', () => {
  it('adds async and data-required-chunk on required chunks', () => {
    expect(
      createScriptTag({
        src: '/en-translations.js',
        isRequiredChunk: true,
      }),
    ).toMatchInlineSnapshot(
      `"<script type="module" async data-required-chunk src="/en-translations.js"></script>"`,
    );
  });

  it('does not add async or data-required-chunk on the client entry', () => {
    expect(createScriptTag({ src: '/vite-client.js' })).toMatchInlineSnapshot(
      `"<script type="module" src="/vite-client.js"></script>"`,
    );
  });
});
