import React from 'react';
import { renderToString } from 'react-dom/server';
import { Box } from 'braid-design-system';
import { BraidTestProvider } from 'braid-design-system/test';

describe('braid-design-system', () => {
  test('components', () => {
    expect(
      renderToString(
        <BraidTestProvider themeName="apac">
          <Box paddingTop="large" />
        </BraidTestProvider>,
      ),
    ).toMatchInlineSnapshot(`
      "<style type="text/css">
                  html,body{margin:0;padding:0;background:#F7F8FB}
                  html.sprinkles_darkMode__8t4triz,html.sprinkles_darkMode__8t4triz body{color-scheme:dark;background:#0E131B}
                </style><div class="apacTheme_default__flv0b00 typography_lightModeTone_light__jjte6s18 typography_darkModeTone_dark__jjte6s1b"><div class="reset_base__1brbmfo0 sprinkles_paddingTop_large_mobile__8t4tri6q"></div></div>"
    `);
  });
});
