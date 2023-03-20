import React from 'react';
import { renderToString } from 'react-dom/server';
import { Box } from 'braid-design-system';
import { BraidTestProvider } from 'braid-design-system/test';
import { vanillaBox } from './App.css';

describe('braid-design-system', () => {
  test('components', () => {
    expect(
      renderToString(
        <BraidTestProvider themeName="apac">
          <Box paddingTop="large" className={vanillaBox} />
        </BraidTestProvider>,
      ),
    ).toMatchInlineSnapshot(`
      "<style type="text/css">
                  html,body{margin:0;padding:0;background:#F7F8FB}
                  html.sprinkles_darkMode__zbxwrwz,html.sprinkles_darkMode__zbxwrwz body{color-scheme:dark;background:#0E131B}
                </style><div class="apacTheme_default__1nvyio50 typography_lightModeTone_light__2k73ke18 typography_darkModeTone_dark__2k73ke1b"><div class="reset_base__136o6wh0 sprinkles_paddingTop_large_mobile__zbxwrw6q App_vanillaBox__inn18b0"></div></div>"
    `);
  });
});
