import { describe, it, expect } from 'vitest';
import {
  bundlers,
  type BundlerValues,
  configure,
  scopeToFixture,
} from '@sku-private/testing-library';

const { sku } = scopeToFixture('start-output');

configure({ asyncUtilTimeout: 5000 });

describe('start-output', () => {
  it.each(bundlers)(
    'should display all available sites for %s',
    async (bundler) => {
      const port = 8222;
      const localhostUrl = `http://localhost:${port}`;
      const localSeekComUrl = `http://local.seek.com:${port}`;

      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts'],
        webpack: [],
      };
      const process = await sku('start', args[bundler]);

      expect(await process.findByText(localhostUrl)).toBeInTheConsole();
      expect(await process.findByText(localSeekComUrl)).toBeInTheConsole();
    },
  );
});
