import { renderToString } from 'react-dom/server';
import { Box, BraidTestProvider } from 'braid-design-system';

describe('braid-design-system', () => {
  test('components', () => {
    expect(
      renderToString(
        <BraidTestProvider themeName="seekAnz">
          <Box paddingTop="large" />
        </BraidTestProvider>,
      ),
    ).toMatchInlineSnapshot(
      `"<style type=\\"text/css\\">body{margin:0;padding:0;background:#eee}</style><div class=\\"base padding_top_large_makeBraidTheme_treatTheme\\"></div>"`,
    );
  });
});
