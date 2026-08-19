import { describe, expect, it } from 'vitest';
import dedent from 'dedent';
import {
  rewriteWebpackLoadableImports,
  assertSingleLoadableRuntime,
} from './rewriteWebpackLoadableImports.js';

describe('rewriteWebpackLoadableImports', () => {
  it('converts the webpack loadable import', () => {
    const result = rewriteWebpackLoadableImports(
      dedent /* tsx */ `
        import loadable from 'sku/@loadable/component';
        const Home = loadable(() => import('./Home'));
      `,
    );

    expect(result?.code).toContain(
      `import { loadable } from "@sku-lib/vite/loadable"`,
    );
    expect(result?.code).not.toContain('sku/@loadable/component');
  });

  it('preserves an aliased local name', () => {
    const result = rewriteWebpackLoadableImports(
      dedent /* tsx */ `
        import myLoadable from 'sku/@loadable/component';
        const Component = myLoadable(() => import('./Component.mjs'));
      `,
    );

    expect(result?.code).toMatchInlineSnapshot(`
      "import { loadable as myLoadable } from "@sku-lib/vite/loadable";
      const Component = myLoadable(() => import('./Component.mjs'));"
    `);
  });

  it('preserves imports that have no vite equivalent', () => {
    const result = rewriteWebpackLoadableImports(
      dedent /* tsx */ `
        import loadable, { loadableReady } from 'sku/@loadable/component';
        const Component = loadable(() => import('./Component'));
        loadableReady(() => {});
      `,
    );

    expect(result?.code).toMatchInlineSnapshot(`
      "import { loadableReady } from "sku/@loadable/component";
      import { loadable } from "@sku-lib/vite/loadable";
      const Component = loadable(() => import('./Component'));
      loadableReady(() => {});"
    `);
  });

  it('returns null when there is no webpack loadable import', () => {
    expect(
      rewriteWebpackLoadableImports(
        `import { loadable } from '@sku-lib/vite/loadable';`,
      ),
    ).toBeNull();
  });

  it('throws when both loadable imports are present', () => {
    expect(() =>
      assertSingleLoadableRuntime(
        dedent /* tsx */ `
          import loadable from 'sku/@loadable/component';
          import { loadable as viteLoadable } from '@sku-lib/vite/loadable';
        `,
        '/project/src/App.jsx',
      ),
    ).toThrow('Please remove one of them');
  });
});
