import React from 'react';
import { renderToString } from 'react-dom/server';
import seekAnz from 'braid-design-system/themes/seekAnz';
import { Box, BraidProvider } from 'braid-design-system';

describe('braid-design-system', () => {
  test('components', () => {
    expect(
      renderToString(
        <BraidProvider theme={seekAnz}>
          <Box paddingTop="large" />
        </BraidProvider>,
      ),
    ).toMatchInlineSnapshot(
      `"<style type=\\"text/css\\">body{margin:0;padding:0;background:#eee}</style><div class=\\"base padding_top_large_theme\\"></div>"`,
    );
  });
});
