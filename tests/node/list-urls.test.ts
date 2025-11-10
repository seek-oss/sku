import { describe, it, test, expect } from 'vitest';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';

const { sku } = scopeToFixture('list-urls');

const makeUrls = (port: number) => [
  `http://localhost:${port}`,
  `http://local.seek.com:${port}`,
  `http://dev.seek.com.au:${port}`,
];

const urls = makeUrls(8222);
const serverUrls = makeUrls(8223);

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
      test.each(bundlers)('`start` with %s', async (bundler) => {
        const args: BundlerValues<string[]> = {
          vite: ['--config', 'sku.config.vite.ts', flag],
          webpack: [flag],
        };
        const process = await sku('start', args[bundler]);

        for (const url of urls) {
          expect(await process.findByText(url)).toBeInTheConsole();
        }
      });

      it('start-ssr', async () => {
        const process = await sku('start-ssr', [flag]);

        for (const url of serverUrls) {
          expect(await process.findByText(url)).toBeInTheConsole();
        }
      });
    },
  );
});
