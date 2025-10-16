import { describe, it, expect } from 'vitest';
import {
  bundlers,
  type BundlerValues,
  configure,
  scopeToFixture,
} from '@sku-private/testing-library';

const { sku } = scopeToFixture('list-urls');

const urls = [
  'http://localhost:8222',
  'http://local.seek.com:8222',
  'http://dev.seek.com.au:8222',
];

configure({ asyncUtilTimeout: 5000 });

describe('list-urls', () => {
  it.each(bundlers)(
    'should not display all urls be default',
    async (bundler) => {
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts'],
        webpack: [],
      };
      const process = await sku('start', args[bundler]);

      expect(await process.findByText(urls[0])).toBeInTheConsole();
      expect(process.queryByText(urls[1])).not.toBeInTheConsole();
      expect(process.queryByText(urls[2])).not.toBeInTheConsole();
    },
  );

  describe.each(['--list-urls', '-l'])(
    'should display all urls when %s is passed',
    (flag) => {
      it.each(bundlers)('bundler %s', async (bundler) => {
        const args: BundlerValues<string[]> = {
          vite: ['--config', 'sku.config.vite.ts', flag],
          webpack: [flag],
        };
        const process = await sku('start', args[bundler]);

        for (const url of urls) {
          expect(await process.findByText(url)).toBeInTheConsole();
        }
      });
    },
  );
});
