import dedent from 'dedent';
import { describe, expect, it } from 'vitest';
import { transform, type UnassertOptions } from './index.ts';

function unassert(
  code: string,
  options?: UnassertOptions,
  filename = 'input.js',
) {
  return transform(code, filename, options)?.code ?? code;
}

describe('raw transfer', () => {
  it('produces identical output with and without raw transfer', () => {
    const input = dedent`
      import assert from 'node:assert';
      if (a) assert(1); else assert(2);
      (assert = require('assert'), assert(x));
      console.assert(y);
      export function f() { return 1; }
    `;

    expect(transform(input, 'input.js', {}, { rawTransfer: false })?.code).toBe(
      transform(input, 'input.js')?.code,
    );
  });

  it('applies custom options, including dotted variable patterns', () => {
    const options: UnassertOptions = {
      variables: ['invariant', 'this.check', 'import.meta.assert'],
      modules: ['tiny-invariant'],
    };
    const input = dedent`
      import invariant from 'tiny-invariant';
      import assert from 'assert';
      invariant(x, 'msg');
      assert(x);
      this.check(x);
      this.check.deep(x);
      this.other(x);
      import.meta.assert(x);
      console.assert(x);
    `;

    expect(unassert(input, options)).toMatchInlineSnapshot(`
      "import assert from 'assert';
      assert(x);
      this.other(x);
      "
    `);
  });
});

describe('output formatting', () => {
  it('removes whole lines and keeps the rest of the source intact', () => {
    const input = dedent`
      import assert from 'node:assert';

      export function add(a, b) {
        assert(typeof a === 'number');
        console.assert(typeof b === 'number', 'b must be a number');
        if (a < 0) assert.fail('negative');
        return a + b; // keep me
      }
    `;

    expect(unassert(input)).toMatchInlineSnapshot(`
      "
      export function add(a, b) {
        if (a < 0) {}
        return a + b; // keep me
      }"
    `);
  });

  it('removes declarators with their separating commas', () => {
    expect(
      unassert(`var foo = 1, assert = require('assert'), bar = 2;`),
    ).toMatchInlineSnapshot(`"var foo = 1, bar = 2;"`);
    expect(
      unassert(`var foo = 1, assert = require('assert');`),
    ).toMatchInlineSnapshot(`"var foo = 1;"`);
  });

  it('returns null when nothing changes', () => {
    expect(transform(`const x = 1;`, 'a.js')).toBeNull();
  });

  it('skips parsing files that cannot contain an assertion', () => {
    // A parse would throw on this syntax error.
    expect(transform(`console.log(`, 'a.js')).toBeNull();
  });

  it('handles TypeScript', () => {
    const input = dedent`
      import assert from 'node:assert';
      export function f(x: number): number {
        assert(x > 0);
        return x satisfies number;
      }
    `;

    expect(transform(input, 'a.ts')?.code).toMatchInlineSnapshot(`
      "export function f(x: number): number {
        return x satisfies number;
      }"
    `);
  });

  it('handles JSX', () => {
    const input = dedent`
      function C() {
        assert(true);
        return <div>{assert}</div>;
      }
    `;

    expect(transform(input, 'a.jsx')?.code).toMatchInlineSnapshot(`
      "function C() {
        return <div>{assert}</div>;
      }"
    `);
  });

  it('throws on syntax errors', () => {
    expect(() => transform(`assert(`, 'a.js')).toThrow(SyntaxError);
  });
});
