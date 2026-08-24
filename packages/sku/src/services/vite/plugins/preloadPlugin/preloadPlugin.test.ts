import { describe, expect, it, vi } from 'vitest';
import type { Plugin, TransformResult } from 'vite';
import { preloadPlugin } from './preloadPlugin.js';
import dedent from 'dedent';

const transformCode = async ({
  code,
  id,
  convertFromWebpack = true,
  environment = 'client',
  commandName = 'start',
}: {
  code: string;
  id: string;
  convertFromWebpack?: boolean;
  environment?: 'client' | 'ssr';
  commandName?: 'start' | 'build';
}) => {
  const { transform } = preloadPlugin({
    convertFromWebpack,
    commandName,
  }) as Plugin & {
    transform: (
      this: {
        environment: { name: string };
        warn: (message: string) => void;
        error: (message: string) => void;
      },
      code: string,
      id: string,
    ) => Promise<TransformResult>;
  };

  const warn = vi.fn();
  const error = vi.fn();

  const result = await transform.call(
    { environment: { name: environment }, warn, error },
    code,
    id,
  );

  return {
    code: typeof result === 'string' ? result : (result?.code ?? null),
    warn,
    error,
  };
};

describe('preloadPlugin', () => {
  describe('convert from webpack', () => {
    it('converts the webpack loadable import', async () => {
      const { code, warn, error } = await transformCode({
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
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });

    it.for(['.mjs', '.cjs', '.mts', '.cts', '.js', '.jsx', '.ts', '.tsx'])(
      'converts the webpack loadable import in %s files',
      async (extension) => {
        const { code } = await transformCode({
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

    it('ignores files that are not scanned', async () => {
      const { code } = await transformCode({
        id: '/project/src/App.vue',
        code: `import loadable from 'sku/@loadable/component';`,
      });

      expect(code).toBeNull();
    });

    it('rewrites the default import and warns about a leftover webpack specifier on start', async () => {
      const { code, warn, error } = await transformCode({
        commandName: 'start',
        id: '/project/src/App.jsx',
        code: dedent /* tsx */ `
        import loadable, { loadableReady } from 'sku/@loadable/component';
        const Home = loadable(() => import('./Home'));
        `,
      });

      expect(code).toContain(
        `import { loadable } from "@sku-lib/vite/loadable"`,
      );
      expect(code).toContain(
        `import { loadableReady } from "sku/@loadable/component"`,
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain(
        `Found 'sku/@loadable/component' import in '/project/src/App.jsx'`,
      );
      expect(error).not.toHaveBeenCalled();
    });

    it('rewrites the default import and errors on a leftover webpack specifier on build', async () => {
      const { code, warn, error } = await transformCode({
        commandName: 'build',
        id: '/project/src/App.jsx',
        code: dedent /* tsx */ `
        import loadable, { loadableReady } from 'sku/@loadable/component';
        const Home = loadable(() => import('./Home'));
        `,
      });

      expect(code).toContain(
        `import { loadable } from "@sku-lib/vite/loadable"`,
      );
      expect(code).toContain(
        `import { loadableReady } from "sku/@loadable/component"`,
      );
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0][0]).toContain(
        `Found 'sku/@loadable/component' import in '/project/src/App.jsx'`,
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('without conversion', () => {
    it('warns about webpack loadable imports in dependencies on start', async () => {
      const id = '/project/node_modules/some-package/dist/index.mjs';
      const { code, warn, error } = await transformCode({
        convertFromWebpack: false,
        commandName: 'start',
        id,
        code: dedent /* tsx */ `
        import loadable from 'sku/@loadable/component';
        const Component = loadable(() => import('./Component.mjs'));
        `,
      });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain(
        `Found 'sku/@loadable/component' import in '${id}'`,
      );
      expect(error).not.toHaveBeenCalled();
      expect(code).toBeNull();
    });

    it('errors on webpack loadable imports in dependencies on build', async () => {
      const id = '/project/node_modules/some-package/dist/index.mjs';
      const { code, warn, error } = await transformCode({
        convertFromWebpack: false,
        commandName: 'build',
        id,
        code: dedent /* tsx */ `
        import loadable from 'sku/@loadable/component';
        const Component = loadable(() => import('./Component.mjs'));
        `,
      });

      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0][0]).toContain(
        `Found 'sku/@loadable/component' import in '${id}'`,
      );
      expect(warn).not.toHaveBeenCalled();
      expect(code).toBeNull();
    });

    it('warns once per file', async () => {
      const { warn, error } = await transformCode({
        convertFromWebpack: false,
        id: '/project/src/App.jsx',
        code: dedent /* tsx */ `
        import { useState } from 'react';
        import loadable from 'sku/@loadable/component';
        import { Text } from 'braid-design-system';

        const Home = loadable(() => import('./Home'));
        `,
      });

      expect(warn).toHaveBeenCalledTimes(1);
      expect(error).not.toHaveBeenCalled();
    });
  });

  describe('module ID injection', () => {
    // `injectModuleID` resolves the dynamic import on disk, so a real file is needed.
    const id = `${import.meta.dirname}/preloadPlugin.ts`;

    it('injects the module ID without renaming an aliased vite import', async () => {
      const { code } = await transformCode({
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
      const { code } = await transformCode({
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
});
