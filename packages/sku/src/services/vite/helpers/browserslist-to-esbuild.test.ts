import { test, expect } from 'vitest';
import browserslistToEsbuild from './browserslist-to-esbuild.js';

test('works by passing browsers as array', () => {
  const target = browserslistToEsbuild([
    '>0.2%',
    'not dead',
    'not op_mini all',
  ]);

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome109",
      "edge136",
      "firefox115",
      "ios15.6",
      "safari18.5",
    ]
  `);
});

test('works by passing browsers as string', () => {
  const target = browserslistToEsbuild('last 2 versions');

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome137",
      "edge137",
      "firefox139",
      "ie10",
      "ios18.4",
      "opera116",
      "safari18.4",
    ]
  `);
});

test('works with ios', () => {
  const target = browserslistToEsbuild('ios >= 9');

  expect(target).toMatchInlineSnapshot(`
    [
      "ios9",
    ]
  `);
});

test('works with android and ios', () => {
  const target = browserslistToEsbuild('ios >= 11, android >= 5');

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome138",
      "ios11",
    ]
  `);
});

test('no support for android 4', () => {
  const target = browserslistToEsbuild('android >= 4');

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome138",
    ]
  `);
});

test('safari TP defaults to latest safari', () => {
  const target = browserslistToEsbuild('safari TP');

  expect(target).toMatchInlineSnapshot(`
    [
      "safari18.5",
    ]
  `);
});
