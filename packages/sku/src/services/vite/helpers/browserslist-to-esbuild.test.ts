import { test, expect } from 'vitest';
import browserslistToEsbuild from './browserslist-to-esbuild.js';
import browserslistConfigSeek from 'browserslist-config-seek';

test('works by passing browsers as array', () => {
  const target = browserslistToEsbuild([
    '>0.2%',
    'not dead',
    'not op_mini all',
  ]);

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome109",
      "edge151",
      "firefox121",
      "ios16.6",
      "opera135",
      "safari18.5",
    ]
  `);
});

test('works by passing browsers as string', () => {
  const target = browserslistToEsbuild('last 2 versions');

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome155",
      "edge154",
      "firefox158",
      "ie10",
      "ios26.6",
      "opera134",
      "safari26.6",
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
      "chrome156",
      "ios11",
    ]
  `);
});

test('no support for android 4', () => {
  const target = browserslistToEsbuild('android >= 4');

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome156",
    ]
  `);
});

test('safari TP defaults to latest safari', () => {
  const target = browserslistToEsbuild('safari TP');

  expect(target).toMatchInlineSnapshot(`
    [
      "safari27",
    ]
  `);
});

test('handles browserslist-config-seek', () => {
  const target = browserslistToEsbuild(browserslistConfigSeek);

  expect(target).toMatchInlineSnapshot(`
    [
      "chrome95",
      "edge95",
      "firefox98",
      "ios15.4",
      "safari15.4",
    ]
  `);
});
