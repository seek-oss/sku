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
                  html.darkMode__17jnngiz,html.darkMode__17jnngiz body{color-scheme:dark;background:#0E131B}
                </style><div class="apac__sgdhw10 lightModeTone_light__1ngbg0u18 darkModeTone_dark__1ngbg0u1b"><div class="base__1thy3kk0 paddingTop_large_mobile__17jnngi6y App_vanillaBox__inn18b0"></div></div>"
    `);
  });
});
