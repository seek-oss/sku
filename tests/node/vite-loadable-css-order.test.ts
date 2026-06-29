import path from 'node:path';

import { describe, it, expect } from 'vitest';
import { parse } from 'node-html-parser';

import { scopeToFixture, waitFor } from '@sku-private/testing-library';
import { dirContentsToObject } from '@sku-private/test-utils';

const { sku, fixturePath } = scopeToFixture('vite-loadable-css-order');

const getStylesheetHrefs = (html: string) =>
  parse(html)
    .querySelectorAll('link[rel="stylesheet"]')
    .map((link) => link.getAttribute('href'))
    .filter((href): href is string => Boolean(href));

describe('vite loadable CSS ordering', () => {
  it("should emit CSS for a chunk's dependencies (reset) before the emitting its own CSS (rest)", async () => {
    const build = await sku('build');

    await waitFor(() => {
      expect(build.hasExit()).toMatchObject({ exitCode: 0 });
    });
    expect(await build.findByText('Sku build complete')).toBeInTheConsole();

    const distFiles = await dirContentsToObject(fixturePath('dist'), [
      'css',
      'html',
    ]);
    const hrefs = getStylesheetHrefs(distFiles['index.html']);

    const cssContents = hrefs.map((href) => {
      const fileName = path.basename(href);
      const contents = distFiles[fileName];
      return { href, contents };
    });

    // Identify which emitted stylesheet contains the reset by reading each file
    // and looking for `box-sizing:border-box`, which the Braid reset provides.
    // See https://github.com/seek-oss/braid-design-system/blob/9fc0b9a705e1ab7b5c33561ac88c3dc41335e08c/packages/braid-design-system/src/lib/css/reset/reset.css.ts#L9
    const resetIndex = cssContents.findIndex(({ contents }) =>
      contents.includes('box-sizing:border-box'),
    );

    // The reset must load before other styles
    expect(resetIndex).toBe(0);
  });
});
