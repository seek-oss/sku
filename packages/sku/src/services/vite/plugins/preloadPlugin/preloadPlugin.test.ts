import { describe, expect, it, vi } from 'vitest';
import type { Plugin, TransformResult } from 'vite';
import { preloadPlugin } from './preloadPlugin.js';
import dedent from 'dedent';

const transformCode = async ({
  code,
  id,
  convertFromWebpack = true,
  environment = 'client',
}: {
  code: string;
  id: string;
  convertFromWebpack?: boolean;
  environment?: 'client' | 'ssr';
}) => {
  const { transform } = preloadPlugin({ convertFromWebpack }) as Plugin & {
    transform: (
      this: { environment: { name: string } },
      code: string,
      id: string,
    ) => Promise<TransformResult>;
  };

  const result = await transform.call(
    { environment: { name: environment } },
    code,
    id,
  );

  return typeof result === 'string' ? result : (result?.code ?? null);
};

describe('preloadPlugin', () => {
  describe('convert from webpack', () => {
    it('converts the webpack loadable import', async () => {
      const code = await transformCode({
        id: '/project/src/App.jsx',
        code: dedent /* tsx */ `
        import loadable from 'sku/@loadable/component';
        const Home = loadable(() => import('./Home'));
        `,
      });

      expect(code).toContain(
        `import { loadable } from "@sku-lib/vite/loadable"`,
      );
      expect(code).not.toContain('sku/@loadable/component');
    });

    it.for(['.mjs', '.cjs', '.mts', '.cts', '.js', '.jsx', '.ts', '.tsx'])(
      'converts the webpack loadable import in %s files',
      async (extension) => {
        const code = await transformCode({
          id: `/project/node_modules/some-package/dist/index${extension}`,
          code: dedent /* tsx */ `
          import loadable from 'sku/@loadable/component';
          const Component = loadable(() => import('./Component'));
          `,
        });

        expect(code).toContain(
          `import { loadable } from "@sku-lib/vite/loadable"`,
        );
      },
    );

    it('preserves an aliased local name', async () => {
      const code = await transformCode({
        id: '/project/node_modules/some-package/dist/index.mjs',
        code: dedent /* tsx */ `
        import myLoadable from 'sku/@loadable/component';
        const Component = myLoadable(() => import('./Component.mjs'));
        `,
      });

      expect(code).toMatchInlineSnapshot(`
        "import { loadable as myLoadable } from "@sku-lib/vite/loadable";
        const Component = myLoadable(() => import('./Component.mjs'));"
      `);
    });

    it('preserves imports that have no vite equivalent', async () => {
      const code = await transformCode({
        id: '/project/src/client.tsx',
        code: dedent /* tsx */ `
        import loadable, { loadableReady } from 'sku/@loadable/component';
        const Component = loadable(() => import('./Component'));
        loadableReady(() => {});
        `,
      });

      expect(code).toMatchInlineSnapshot(`
        "import { loadableReady } from "sku/@loadable/component";
        import { loadable } from "@sku-lib/vite/loadable";
        const Component = loadable(() => import('./Component'));
        loadableReady(() => {});"
      `);
    });

    it('ignores files that are not scanned', async () => {
      const code = await transformCode({
        id: '/project/src/App.vue',
        code: `import loadable from 'sku/@loadable/component';`,
      });

      expect(code).toBeNull();
    });
  });

  describe('without conversion', () => {
    it('warns about webpack loadable imports in dependencies', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      const id = '/project/node_modules/some-package/dist/index.mjs';
      const code = await transformCode({
        convertFromWebpack: false,
        id,
        code: dedent /* tsx */ `
        import loadable from 'sku/@loadable/component';
        const Component = loadable(() => import('./Component.mjs'));
        `,
      });

      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog.mock.calls[0][0]).toContain(
        `Found 'sku/@loadable/component' import in '${id}'`,
      );
      expect(code).not.toContain('@sku-lib/vite/loadable');

      consoleLog.mockRestore();
    });

    it('warns once per file', async () => {
      const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

      await transformCode({
        convertFromWebpack: false,
        id: '/project/src/App.jsx',
        code: dedent /* tsx */ `
        import { useState } from 'react';
        import loadable from 'sku/@loadable/component';
        import { Text } from 'braid-design-system';

        const Home = loadable(() => import('./Home'));
        `,
      });

      expect(consoleLog).toHaveBeenCalledTimes(1);

      consoleLog.mockRestore();
    });
  });

  describe('module ID injection', () => {
    // `injectModuleID` resolves the dynamic import on disk, so a real file is needed.
    const id = `${import.meta.dirname}/preloadPlugin.ts`;

    it('injects the module ID without renaming an aliased vite import', async () => {
      const code = await transformCode({
        environment: 'ssr',
        id,
        code: dedent /* tsx */ `
        import { loadable as myLoadable } from '@sku-lib/vite/loadable';
        const Component = myLoadable(() => import('./preloadPlugin.js'));
        `,
      });

      expect(code).toMatchInlineSnapshot(`
        "import { loadable as myLoadable } from '@sku-lib/vite/loadable';
        const Component = myLoadable(() => import('./preloadPlugin.js'), {
          ssr: import.meta.env.SSR
        }, "packages/sku/src/services/vite/plugins/preloadPlugin/preloadPlugin.ts");"
      `);
    });

    it('injects the module ID for a converted aliased webpack import', async () => {
      const code = await transformCode({
        environment: 'ssr',
        id,
        code: dedent /* tsx */ `
        import myLoadable from 'sku/@loadable/component';
        const Component = myLoadable(() => import('./preloadPlugin.js'));
        `,
      });

      expect(code).toMatchInlineSnapshot(`
        "import { loadable as myLoadable } from "@sku-lib/vite/loadable";
        const Component = myLoadable(() => import('./preloadPlugin.js'), {
          ssr: import.meta.env.SSR
        }, "packages/sku/src/services/vite/plugins/preloadPlugin/preloadPlugin.ts");"
      `);
    });
  });

  it('throws when both loadable imports are present', async () => {
    await expect(
      transformCode({
        id: '/project/src/App.jsx',
        code: dedent /* tsx */ `
        import loadable from 'sku/@loadable/component';
        import { loadable as viteLoadable } from '@sku-lib/vite/loadable';
        `,
      }),
    ).rejects.toThrow('Please remove one of them');
  });
});
