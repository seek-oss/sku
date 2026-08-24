import { afterEach, describe, expect, it, vi } from 'vitest';
import { convertLoadableDepOptimizePlugin } from './convertLoadableDepOptimizePlugin.js';
import dedent from 'dedent';

afterEach(() => {
  vi.restoreAllMocks();
});

const getHandler = (convertFromWebpack?: boolean) => {
  const plugin = convertLoadableDepOptimizePlugin({
    convertFromWebpack,
  }) as unknown as {
    transform: {
      handler: (code: string, id: string) => { code: string } | null;
    };
  };

  return plugin.transform.handler;
};

const runHandler = ({
  code,
  id,
  convertFromWebpack,
}: {
  code: string;
  id: string;
  convertFromWebpack?: boolean;
}) => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const result = getHandler(convertFromWebpack)(code, id);

  return { code: result?.code ?? null, warn };
};

describe('convertLoadableDepOptimizePlugin', () => {
  const id = '/project/node_modules/some-package/dist/index.js';

  it('warns and does not rewrite when not converting', () => {
    const source = dedent /* tsx */ `
      import loadable from 'sku/@loadable/component';
      const Component = loadable(() => import('./Component'));
    `;

    const { code, warn } = runHandler({ id, code: source });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(
      `Found 'sku/@loadable/component' import in '${id}'`,
    );
    expect(warn.mock.calls[0][0]).toContain('contact the dependency author');
    expect(code).toBeNull();
  });

  it('rewrites the default import without warning', () => {
    const { code, warn } = runHandler({
      id,
      convertFromWebpack: true,
      code: dedent /* tsx */ `
        import loadable from 'sku/@loadable/component';
        const Component = loadable(() => import('./Component'));
      `,
    });

    expect(code).toContain(`import { loadable } from "@sku-lib/vite/loadable"`);
    expect(code).not.toContain('sku/@loadable/component');
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and does not rewrite a leftover webpack specifier', () => {
    const { code, warn } = runHandler({
      id,
      convertFromWebpack: true,
      code: dedent /* tsx */ `
        import { loadableReady } from 'sku/@loadable/component';
        loadableReady();
      `,
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(
      `Found 'sku/@loadable/component' import in '${id}'`,
    );
    expect(warn.mock.calls[0][0]).toContain('contact the dependency author');
    expect(code).toContain('sku/@loadable/component');
    expect(code).not.toContain('@sku-lib/vite/loadable');
  });

  it('warns once per module across repeated optimization runs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = getHandler();
    const source = dedent /* tsx */ `
      import loadable from 'sku/@loadable/component';
      const Component = loadable(() => import('./Component'));
    `;

    handler(source, id);
    handler(source, id);

    expect(warn).toHaveBeenCalledTimes(1);
  });
});
