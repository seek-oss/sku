import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type * as skuUtils from '@sku-private/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sku-private/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof skuUtils>();
  return {
    ...actual,
    requireFromCwd: vi.fn((id: string) => {
      if (id === 'react/package.json') {
        return { version: '18.3.1' };
      }
      if (id === './package.json') {
        return { name: 'react18-gate-fixture', type: 'module' };
      }
      return actual.requireFromCwd(id);
    }),
  };
});

describe('Vite SSR React version gate', () => {
  let root: string;
  let previousCwd: string;

  beforeEach(() => {
    vi.resetModules();
    previousCwd = process.cwd();
    root = join(tmpdir(), `sku-react18-gate-${Date.now()}`);
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(
      join(root, 'sku.config.ts'),
      `export default {
  bundler: 'vite',
  renderType: 'server-side-rendered',
  appEntry: 'src/app.tsx',
};
`,
    );
    writeFileSync(
      join(root, 'src', 'app.tsx'),
      'export default { routes: [] };\n',
    );
    writeFileSync(
      join(root, 'package.json'),
      JSON.stringify({ name: 'react18-gate-fixture', type: 'module' }),
    );
    process.chdir(root);
  });

  afterEach(() => {
    process.chdir(previousCwd);
    rmSync(root, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('rejects React major versions below 19', async () => {
    const { createSkuContext } =
      await import('../../../context/createSkuContext.js');

    await expect(
      createSkuContext({ configPath: 'sku.config.ts' }),
    ).rejects.toThrow(/Vite SSR requires React 19 or newer/);
  });
});
