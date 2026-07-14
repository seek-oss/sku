import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type * as skuUtils from '@sku-private/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRoot } = vi.hoisted(() => ({
  mockRoot: { current: '' },
}));

vi.mock('@sku-private/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof skuUtils>();
  return {
    ...actual,
    getPathFromCwd: (filePath: string) => join(mockRoot.current, filePath),
    requireFromCwd: vi.fn((id: string) => {
      if (id === 'react/package.json') {
        return { version: '19.0.0' };
      }
      if (id === './package.json') {
        return { name: 'vite-ssr-entry-gate-fixture', type: 'module' };
      }
      return actual.requireFromCwd(id);
    }),
  };
});

const writeMinimalViteSsrFiles = (root: string) => {
  writeFileSync(
    join(root, 'sku.config.ts'),
    `export default {
  bundler: 'vite',
  renderType: 'server-side-rendered',
  routesEntry: 'src/routes.tsx',
};
`,
  );
  writeFileSync(join(root, 'src', 'routes.tsx'), 'export const routes = [];\n');
  writeFileSync(
    join(root, 'src', 'server.tsx'),
    `export const onRequest = () => ({});
export const middleware = [];
`,
  );
  writeFileSync(
    join(root, 'src', 'client.tsx'),
    'export const onHydrate = () => ({});\n',
  );
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'vite-ssr-entry-gate-fixture', type: 'module' }),
  );
};

describe('Vite SSR required entry files', () => {
  let root: string;

  beforeEach(() => {
    vi.resetModules();
    root = join(tmpdir(), `sku-vite-ssr-entry-gate-${randomUUID()}`);
    mockRoot.current = root;
    mkdirSync(join(root, 'src'), { recursive: true });
    writeMinimalViteSsrFiles(root);
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('rejects a missing serverEntry file', async () => {
    rmSync(join(root, 'src', 'server.tsx'));
    const { createSkuContext } =
      await import('../../../context/createSkuContext.js');

    await expect(
      createSkuContext({ configPath: 'sku.config.ts' }),
    ).rejects.toThrow(
      /must provide a 'serverEntry' exporting named 'onRequest' and 'middleware'/,
    );
  });

  it('rejects a missing clientEntry file', async () => {
    rmSync(join(root, 'src', 'client.tsx'));
    const { createSkuContext } =
      await import('../../../context/createSkuContext.js');

    await expect(
      createSkuContext({ configPath: 'sku.config.ts' }),
    ).rejects.toThrow(
      /must provide a 'clientEntry' exporting named 'onHydrate'/,
    );
  });

  it('rejects a missing routesEntry file', async () => {
    rmSync(join(root, 'src', 'routes.tsx'));
    const { createSkuContext } =
      await import('../../../context/createSkuContext.js');

    await expect(
      createSkuContext({ configPath: 'sku.config.ts' }),
    ).rejects.toThrow(/must provide a 'routesEntry'/);
  });
});
