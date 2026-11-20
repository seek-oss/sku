import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
import { rolldown, type Plugin } from 'rolldown';
import dedent from 'dedent';
import { assert, describe, expect, it } from 'vitest';
import {
  transform,
  unassert,
  type UnassertPluginOptions,
} from '../src/index.ts';

function virtualFiles(files: Record<string, string>): Plugin {
  return {
    name: 'virtual-files',
    resolveId(id) {
      const fileName = id.replace(/^\.\//, '');
      return fileName in files ? fileName : null;
    },
    load: (id) => files[id] ?? null,
  };
}

async function build(
  files: Record<string, string>,
  options?: UnassertPluginOptions,
) {
  const bundle = await rolldown({
    input: 'entry.js',
    plugins: [virtualFiles(files), unassert(options)],
    external: [/^node:/, 'assert', 'tiny-invariant'],
    treeshake: false,
  });

  const { output } = await bundle.generate({ format: 'esm' });
  await bundle.close();

  return output[0].code;
}

describe('rolldown plugin', () => {
  it('removes assertions and assertion imports across modules', async () => {
    const code = await build({
      'entry.js': dedent`
        import assert from 'node:assert';
        import { divide } from './lib.ts';
        assert(divide);
        console.log(divide(4, 2));
      `,
      'lib.ts': dedent`
        import { strict as assert } from 'assert';
        export function divide(a: number, b: number): number {
          assert.notEqual(b, 0);
          console.assert(b !== 0);
          return a / b;
        }
      `,
    });

    expect(code).toMatchInlineSnapshot(`
      "// lib.ts
      function divide(a, b) {
      	return a / b;
      }
      // entry.js
      console.log(divide(4, 2));
      "
    `);
  });

  it('supports custom variables and modules', async () => {
    const code = await build(
      {
        'entry.js': dedent`
          import invariant from 'tiny-invariant';
          import assert from 'assert';
          invariant(globalThis.x, 'boom');
          assert(globalThis.y);
          export const z = 1;
        `,
      },
      { variables: ['invariant'], modules: ['tiny-invariant'] },
    );

    expect(code).toMatchInlineSnapshot(`
      "import assert from "assert";
      // entry.js
      assert(globalThis.y);
      const z = 1;
      export { z };
      "
    `);
  });

  it('respects include and exclude', async () => {
    const files = {
      'entry.js': dedent`
        import './skip.js';
        assert(1);
      `,
      'skip.js': `assert(2);`,
    };
    const code = await build(files, { exclude: /skip\.js$/ });

    expect(code).toMatchInlineSnapshot(`
      "// skip.js
      assert(2);
      "
    `);
  });

  it('uses a code filter that only lets through files that could contain assertions', () => {
    const plugin = unassert({ variables: ['invariant', 'this.check'] });

    expect(plugin.transform).toMatchObject({
      filter: { code: { include: ['invariant', 'this', 'assert', '\\'] } },
    });
  });
});

describe('source maps', () => {
  it('maps surviving code back to its original location', () => {
    const input = dedent`
      import assert from 'assert';
      export function add(a, b) {
        assert(typeof a === 'number');
        assert.equal(typeof b, 'number');
        return a + b;
      }
    `;

    const result = transform(input, 'add.js');
    assert(result?.map, 'expected a source map');

    const outputLines = result.code.split('\n');
    const lineIndex = outputLines.findIndex((outputLine) =>
      outputLine.includes('return a + b'),
    );
    const lineText = outputLines[lineIndex];
    assert(lineText !== undefined, 'expected the return statement to survive');

    const original = originalPositionFor(new TraceMap(result.map.toString()), {
      line: lineIndex + 1,
      column: lineText.indexOf('return'),
    });
    expect(original).toMatchObject({ source: 'add.js', line: 5, column: 2 });
  });

  it('can be disabled', () => {
    const result = transform(`assert(1);`, 'a.js', {}, { sourcemap: false });

    expect(result).not.toBeNull();
    expect(result?.map).toBeNull();
  });
});
