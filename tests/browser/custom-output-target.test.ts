import { describe, it } from 'vitest';
import { dirContentsToObject } from '@sku-private/test-utils';
import path from 'node:path';
import { scopeToFixture } from '@sku-private/testing-library';

const appDir = path.dirname(
  require.resolve('@sku-fixtures/custom-output-target/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'custom-output-directory');

const { render } = scopeToFixture('custom-output-target');

describe('custom-output-target', () => {
  it('should generate an output directory with the value specified in sku.config', async ({
    expect,
  }) => {
    const build = await render('build');

    expect(await build.findByText('Build complete')).toBeInTheConsole();

    const files = await dirContentsToObject(distDir);
    expect(files).toMatchSnapshot();
  });
});
