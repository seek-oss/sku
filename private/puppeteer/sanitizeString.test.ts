import { describe, it } from 'vitest';
import { sanitizeString } from './sanitizeString.ts';

describe('sanitizeFiles', () => {
  it.for`
    str                                             | expected
    ${'AsyncComponent-C79Xs-pF.js'}                 | ${'AsyncComponent-{hash}.js'}
    ${'AsyncComponent-C79Xs-pF.js.map'}             | ${'AsyncComponent-{hash}.js.map'}
    ${'Details-3_rL4jQS.js'}                        | ${'Details-{hash}.js'}
    ${'Home-BO40DFAf.js.map'}                       | ${'Home-{hash}.js.map'}
    ${'AsyncComponent.chunk.js'}                    | ${'AsyncComponent.chunk.js'}
    ${'handlers-Home-2d237e279ab26e7d9ff4.css.map'} | ${'handlers-Home-2d237e279ab26e7d9ff4.css.map'}
    ${'/static/place/Details-3_rL4jQS.js'}          | ${'/static/place/Details-{hash}.js'}
    ${'/vite-client-UQg7MwHG.css'}                  | ${'/vite-client-{hash}.css'}
    ${'"href="/vite-client-79htCCWk.js"'}            | ${'"href="/vite-client-{hash}.js"'}
    ${'first-child > .Table_cell__y0v62q5'}         | ${'first-child > .Table_cell__y0v62q5'}
    ${'https://error-url.com'}                      | ${'https://error-url.com'}
  `(
    'should replace hashes with a placeholder',
    ({ str, expected }, { expect }) => {
      const result = sanitizeString(str);
      expect(result).toBe(expected);
    },
  );

  it('should replace process.cwd() with {cwd}', ({ expect }) => {
    const result = sanitizeString(`${process.cwd()}/foo/bar.js`);
    expect(result).toBe('{cwd}/foo/bar.js');
  });

  it('should replace .pnpm paths with {package}', ({ expect }) => {
    const result = sanitizeString(
      `/node_modules/.pnpm/foo@1.0.0_bar-1.0.0/node_modules/braid-design-system`,
    );
    expect(result).toBe('/node_modules/braid-design-system');
  });
});
