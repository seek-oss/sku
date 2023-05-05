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
                  html.sprinkles_darkMode__16c5g72z,html.sprinkles_darkMode__16c5g72z body{color-scheme:dark;background:#0E131B}
                </style><div class="apacTheme_default__npohbe0 typography_lightModeTone_light__zydp7818 typography_darkModeTone_dark__zydp781b"><div class="reset_base__1f8m4ej0 sprinkles_paddingTop_large_mobile__16c5g726q App_vanillaBox__inn18b0"></div></div>"
    `);
  });
});
