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
      `"<div class=\\"style padding_top_large_theme\\"></div>"`,
    );
  });
});
