import { describe, it } from 'vitest';
import { dirContentsToObject } from '@sku-private/test-utils';
import { scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('custom-output-target');

describe('custom-output-target', () => {
  it('should generate an output directory with the value specified in sku.config', async ({
    expect,
  }) => {
    const build = await sku('build');

    expect(await build.findByText('Build complete')).toBeInTheConsole();

    const files = await dirContentsToObject(
      fixturePath('custom-output-directory'),
    );
    expect(files).toMatchSnapshot();
  });
});
