import { Box } from 'braid-design-system';
import { BraidTestProvider } from 'braid-design-system/test';
import { renderToString } from 'react-dom/server';
import { describe, expect, test } from 'vitest';

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
                  html,body{margin:0;padding:0;background:#fff}
                  html.sprinkles_darkMode__1dxfmrv10,html.sprinkles_darkMode__1dxfmrv10 body{color-scheme:dark;background:#1C2330}
                </style><div class="seekJobs_seekJobs__1hqills0 typography_lightModeTone_light__1fgofs612 typography_darkModeTone_dark__1fgofs615"><div class="reset_base__5ru98q0 sprinkles_paddingTop_large_mobile__1dxfmrv85 App_vanillaBox__inn18b0"></div></div>"
    `);
  });
});
