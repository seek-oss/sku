import path from 'path';
import { run } from '@sku-private/test-utils';

const appDir = path.dirname(
  require.resolve('@sku-fixtures/jest-test/sku.config.ts'),
);

test('Jest test with preset', async () => {
  const { child } = await run('jest', [], { cwd: appDir });
  expect(child.exitCode).toEqual(0);
});
