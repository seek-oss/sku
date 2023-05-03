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
                  html.sprinkles_darkMode__kmgbkez,html.sprinkles_darkMode__kmgbkez body{color-scheme:dark;background:#0E131B}
                </style><div class="apacTheme_default__1j378ob0 typography_lightModeTone_light__ejg6ik18 typography_darkModeTone_dark__ejg6ik1b"><div class="reset_base__2iyyj50 sprinkles_paddingTop_large_mobile__kmgbke6q App_vanillaBox__inn18b0"></div></div>"
    `);
  });
});
