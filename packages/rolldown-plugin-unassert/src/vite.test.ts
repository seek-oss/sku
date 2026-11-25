import { describe, expect, it } from 'vitest';
import { viteDiscardsSourcemaps } from './vite.ts';

function viteContext(mode: string, sourcemap: boolean | 'inline' | 'hidden') {
  return { environment: { mode, config: { build: { sourcemap } } } };
}

describe('viteDiscardsSourcemaps', () => {
  it.each([
    ['a Vite build without source maps', viteContext('build', false), true],
    ['a Vite build with source maps', viteContext('build', true), false],
    [
      'a Vite build with hidden source maps',
      viteContext('build', 'hidden'),
      false,
    ],
    [
      'a Vite build with inline source maps',
      viteContext('build', 'inline'),
      false,
    ],
    ['the Vite dev server', viteContext('dev', false), false],
    ['plain Rolldown', {}, false],
  ])('%s → %s', (_, context, expected) => {
    expect(viteDiscardsSourcemaps(context)).toBe(expected);
  });
});
