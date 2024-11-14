import { renderToString } from 'react-dom/server';
import { Box } from 'braid-design-system';
import { BraidTestProvider } from 'braid-design-system/test';
import { vanillaBox } from './App.css';

describe('braid-design-system', () => {
  test('components', () => {
    expect(
      renderToString(
        <BraidTestProvider themeName="seekJobs">
          <Box paddingTop="large" className={vanillaBox} />
        </BraidTestProvider>,
      ),
    ).toMatchInlineSnapshot(`
      "<style type="text/css">
                  html,body{margin:0;padding:0;background:#F7F8FB}
                  html.sprinkles_darkMode__7n536nz,html.sprinkles_darkMode__7n536nz body{color-scheme:dark;background:#0E131B}
                </style><div class="apacTheme_apac__1hqgmsr0 typography_lightModeTone_light__ndjjoi18 typography_darkModeTone_dark__ndjjoi1b"><div class="reset_base__14h31gj0 sprinkles_paddingTop_large_mobile__7n536n6y App_vanillaBox__inn18b0"></div></div>"
    `);
  });
});
