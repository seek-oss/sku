import { test, expect } from 'vitest';
import { scopeToFixture } from '@sku-private/testing-library';

const { sku } = scopeToFixture('legacy-react');

test('Legacy React should warn', async () => {
  const skuProcess = await sku('configure');
  expect(
    await skuProcess.findByText('React 18 or below detected'),
  ).toBeInTheConsole();
});
