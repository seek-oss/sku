import { rolldown, type Plugin } from 'rolldown';
import dedent from 'dedent';
import { describe, expect, it } from 'vitest';
import {
  displayName,
  transform,
  type DisplayNamePluginOptions,
} from './index.js';

describe('transform', () => {
  it('supports TypeScript syntax', () => {
    const result = transform(
      dedent`
        import { memo } from 'react';
        export const Test: React.FC<Props> = (props: Props) => <img {...props} />;
        export const Memoed = memo((props: Props) => <img {...props} /> satisfies unknown);
      `,
      'input.tsx',
    );

    expect(result?.code).toContain('Test.displayName = "Test";');
    expect(result?.code).toContain('Memoed.displayName = "Memoed";');
  });

  it('supports aliased imports', () => {
    const result = transform(
      dedent`
        import { memo as m } from 'react';
        const Test = m(Component);
      `,
      'input.js',
    );

    expect(result?.code).toContain('Test.displayName = "Test";');
  });

  it('returns null when nothing changes', () => {
    expect(transform('export const a = 1;', 'input.js')).toBeNull();
    expect(
      transform('const a = () => <img/>; a.displayName = "a";', 'input.jsx'),
    ).toBeNull();
  });

  it('generates a source map', () => {
    const result = transform('const Test = () => <img/>;', 'input.jsx');
    expect(result?.map?.sources).toEqual(['input.jsx']);
    expect(
      transform(
        'const Test = () => <img/>;',
        'input.jsx',
        {},
        { sourcemap: false },
      )?.map,
    ).toBeNull();
  });

  it('throws on syntax errors', () => {
    expect(() => transform('const = <img/>;', 'input.jsx')).toThrow(
      SyntaxError,
    );
  });
});

describe('rolldown plugin', () => {
  async function build(
    files: Record<string, string>,
    options?: DisplayNamePluginOptions,
  ) {
    const virtualFiles: Plugin = {
      name: 'virtual-files',
      resolveId(id) {
        const fileName = id.replace(/^\.\//, '');
        return fileName in files ? fileName : null;
      },
      load: (id) => files[id] ?? null,
    };

    const bundle = await rolldown({
      input: 'entry.jsx',
      plugins: [virtualFiles, displayName(options)],
      treeshake: false,
      external: [/^react/],
    });
    const { output } = await bundle.generate({ format: 'esm' });
    await bundle.close();

    return output[0].code;
  }

  it('adds display names before JSX is compiled', async () => {
    const code = await build({
      'entry.jsx': 'export const Test = () => <img />;',
    });

    expect(code).toContain('Test.displayName = "Test";');
  });

  it('skips node_modules by default', async () => {
    const files = {
      'entry.jsx': dedent`
        import { Dep } from './lib/node_modules/dep/index.jsx';
        export const Test = () => <Dep />;
      `,
      'lib/node_modules/dep/index.jsx': 'export const Dep = () => <img />;',
    };

    const code = await build(files);
    expect(code).toContain('Test.displayName = "Test";');
    expect(code).not.toContain('Dep.displayName');

    const included = await build(files, { exclude: [] });
    expect(included).toContain('Dep.displayName = "Dep";');
  });
});
