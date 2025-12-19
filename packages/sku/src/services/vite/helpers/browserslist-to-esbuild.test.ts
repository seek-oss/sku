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
      "edge141",
      "firefox144",
      "ios11",
      "opera122",
      "safari26",
    ]
  `);
});

test('works by passing browsers as string', () => {
  const target = browserslistToEsbuild('last 2 versions');

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome142",
      "edge142",
      "firefox144",
      "ie10",
      "ios18.5",
      "opera121",
      "safari26.1",
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
      "chrome142",
      "ios11",
    ]
  `);
});

test('no support for android 4', () => {
  const target = browserslistToEsbuild('android >= 4');

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome142",
    ]
  `);
});

test('safari TP defaults to latest safari', () => {
  const target = browserslistToEsbuild('safari TP');

  expect(target).toMatchInlineSnapshot(`
    [
      "safari26.2",
    ]
  `);
});
