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
                  html.sprinkles_darkMode__a8rkez,html.sprinkles_darkMode__a8rkez body{color-scheme:dark;background:#0E131B}
                </style><div class="apacTheme_default__1o0j0u80 typography_lightModeTone_light__1np03wo18 typography_darkModeTone_dark__1np03wo1b"><div class="reset_base__1jajid00 sprinkles_paddingTop_large_mobile__a8rke6q App_vanillaBox__c5yboh0"></div></div>"
    `);
  });
});
