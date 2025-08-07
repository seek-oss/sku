import { describe, it } from 'vitest';
import { sanitizeString } from './sanitizeString.ts';

describe('sanitizeString', () => {
  it.for`
    str                                             | expected
    ${'AsyncComponent-C79Xs-pF.js'}                 | ${'AsyncComponent-{hash}.js'}
    ${'AsyncComponent-C79Xs-pF.js.map'}             | ${'AsyncComponent-{hash}.js.map'}
    ${'Details-3_rL4jQS.js'}                        | ${'Details-{hash}.js'}
    ${'Home-BO40DFAf.js.map'}                       | ${'Home-{hash}.js.map'}
    ${'AsyncComponent.chunk.js'}                    | ${'AsyncComponent.chunk.js'}
    ${'handlers-Home-2d237e279ab26e7d9ff4.css.map'} | ${'handlers-Home-2d237e279ab26e7d9ff4.css.map'}
    ${'/static/place/Details-3_rL4jQS.js'}          | ${'/static/place/Details-{hash}.js'}
  `(
    'should replace hashes with a placeholder',
    ({ str, expected }, { expect }) => {
      const result = sanitizeString(str);
      expect(result).toBe(expected);
    },
  );
});
