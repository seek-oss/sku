import { describe, it, expect } from 'vitest';
import { scopeToFixture } from '@sku-private/testing-library';
import { getPort } from '@sku-private/test-utils';

const { sku } = scopeToFixture('port-clash');

describe('port-clash - vite', () => {
  it('should use a different port if the requested port is already in use', async () => {
    const port = await getPort();
    const processOne = await sku('start', [`--port=${port}`]);
    await processOne.findByText(`http://localhost:${port}`);

    const processTwo = await sku('start', [`--port=${port}`]);
    expect(
      await processTwo.findByText(
        new RegExp(
          `Warning: Requested port ${port} is unavailable\\. Falling back to \\d+\\.`,
        ),
      ),
    ).toBeInTheConsole();

    const fallbackPort = processTwo
      .getStdallStr()
      .match(/Falling back to (\d+)\./)?.[1];

    expect(
      await processTwo.findByText(`http://localhost:${fallbackPort}`),
    ).toBeInTheConsole();
    expect(
      processTwo.queryByText(`http://localhost:${port}`),
    ).not.toBeInTheConsole();
  });
});
