import { test, expect } from 'vitest';
import { scopeToFixture, waitFor } from '@sku-private/testing-library';

const { node } = scopeToFixture('jest-test');

test('Jest test with preset', async () => {
  const jest = await node(['node_modules/jest/bin/jest.js']);
  expect(await jest.findByError('Ran all test suites.')).toBeInTheConsole();
  await waitFor(() => {
    expect(jest.hasExit()).toMatchObject({ exitCode: 0 });
  });
});
