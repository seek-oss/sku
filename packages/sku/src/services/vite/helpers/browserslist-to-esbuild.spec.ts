import { test } from 'vitest';
import browserslistToEsbuild from './browserslist-to-esbuild.js';

test('works by passing browsers as array', ({ expect }) => {
  const target = browserslistToEsbuild([
    '>0.2%',
    'not dead',
    'not op_mini all',
  ]);

  expect(target).toStrictEqual([
    'chrome109',
    'edge134',
    'firefox115',
    'ios11',
    'opera117',
    'safari17.6',
  ]);
});

test('works by passing browsers as string', ({ expect }) => {
  const target = browserslistToEsbuild('last 2 versions');

  expect(target).toStrictEqual([
    'chrome135',
    'edge135',
    'firefox137',
    'ie10',
    'ios18.4',
    'opera116',
    'safari18.4',
  ]);
});

test('works with ios', ({ expect }) => {
  const target = browserslistToEsbuild('ios >= 9');

  expect(target).toStrictEqual(['ios9']);
});

test('works with android and ios', ({ expect }) => {
  const target = browserslistToEsbuild('ios >= 11, android >= 5');

  expect(target).toStrictEqual(['chrome136', 'ios11']);
});

test('no support for android 4', ({ expect }) => {
  const target = browserslistToEsbuild('android >= 4');

  expect(target).toStrictEqual(['chrome136']);
});

test('safari TP defaults to latest safari', ({ expect }) => {
  const target = browserslistToEsbuild('safari TP');

  expect(target).toStrictEqual(['safari18.5']);
});
