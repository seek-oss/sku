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
                  html.sprinkles_darkMode__snqh4ez,html.sprinkles_darkMode__snqh4ez body{color-scheme:dark;background:#0E131B}
                </style><div class="apacTheme_default__fkgxba0 typography_lightModeTone_light__1wxfcta18 typography_darkModeTone_dark__1wxfcta1b"><div class="reset_base__54r4c40 sprinkles_paddingTop_large_mobile__snqh4e6q App_vanillaBox__1akvwaz0"></div></div>"
    `);
  });
});
