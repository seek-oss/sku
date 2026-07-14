import { test, expect } from 'vitest';
import { scopeToFixture } from '@sku-private/testing-library';
import { mkdir, rm, writeFile } from 'node:fs/promises';

const { sku, fixturePath } = scopeToFixture('legacy-react');

const fakeReactPackageJson = {
  name: 'react',
  version: '18.0.0',
};

test('Legacy React should warn', async () => {
  await mkdir(fixturePath('node_modules/react'), { recursive: true });
  await writeFile(
    fixturePath('node_modules/react/package.json'),
    JSON.stringify(fakeReactPackageJson),
    'utf8',
  );

  const skuProcess = await sku('configure');
  expect(
    await skuProcess.findByText('React 18 or below detected'),
  ).toBeInTheConsole();

  await rm(fixturePath('node_modules/react'), { recursive: true, force: true });
});
