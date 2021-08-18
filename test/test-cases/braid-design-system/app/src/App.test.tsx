import React from 'react';
import { renderToString } from 'react-dom/server';
import { Box, BraidTestProvider } from 'braid-design-system';

describe('braid-design-system', () => {
  test('components', () => {
    expect(
      renderToString(
        <BraidTestProvider themeName="seekAnz">
          <Box paddingTop="large" />
        </BraidTestProvider>,
      ),
    ).toMatchInlineSnapshot(
      `"<style type=\\"text/css\\">body{margin:0;padding:0;background:#eee}</style><div class=\\"seekAnzTheme_default__1kubmhw0\\"><div class=\\"reset_base__1brbmfo0 sprinkles_paddingTop_large_mobile__8t4tri40\\"></div></div>"`,
    );
  });
});
