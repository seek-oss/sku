import React from 'react';
import { renderToString } from 'react-dom/server';
import seekAnz from 'braid-design-system/themes/seekAnz';
import { Box, ThemeProvider } from 'braid-design-system';

describe('braid-design-system', () => {
  test('components', () => {
    expect(
      renderToString(
        <ThemeProvider theme={seekAnz}>
          <Box paddingTop="large" />
        </ThemeProvider>,
      ),
    ).toMatchInlineSnapshot(`"<div class=\\"top_large_theme\\"></div>"`);
  });
});
