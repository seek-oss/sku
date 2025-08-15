import { defaultExclude, defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { TEST_TIMEOUT } from '@sku-private/test-utils/constants';

const defaultInclude = '**/*.{test,spec}.?(c|m)[jt]s?(x)';

export default defineConfig({
  plugins: [tsconfigPaths()],
  server: {
    watch: {
      ignored: ['**/fixtures/**'],
    },
  },
  test: {
    setupFiles: ['./vitest-setup.ts'],
    // Increasing the number so functions using TEST_TIMEOUT can timeout before the test does.
    hookTimeout: TEST_TIMEOUT + 1000,
    testTimeout: TEST_TIMEOUT + 1000,
    exclude: [...defaultExclude, '**/fixtures/**'],
    restoreMocks: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: [
            `packages/${defaultInclude}`,
            `private/${defaultInclude}`,
            `tests/node/${defaultInclude}`,
          ],
        },
      },
      // Isolate braid to reduce flakiness.
      {
        extends: true,
        test: {
          name: 'braid-design-system',
          environment: 'puppeteer',
          globalSetup: 'vitest-environment-puppeteer/global-init',
          include: [`tests/browser/braid-design-system.test.ts`],
          sequence: {
            groupOrder: -1,
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          environment: 'puppeteer',
          globalSetup: 'vitest-environment-puppeteer/global-init',
          include: [
            `tests/browser/${defaultInclude}`,
            '!tests/browser/braid-design-system.test.ts',
          ],
        },
      },
    ],
  },
});
