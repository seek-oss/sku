import { defaultExclude, defineConfig } from 'vitest/config';
import { TEST_TIMEOUT } from '@sku-private/test-utils/constants';

const defaultInclude = '**/*.{test,spec}.?(c|m)[jt]s?(x)';
const babelPluginDisplayNameTests = 'packages/babel-plugin-display-name';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    watch: {
      ignored: ['**/fixtures/**'],
    },
  },
  test: {
    exclude: [...defaultExclude, '**/fixtures/**'],
    hookTimeout: TEST_TIMEOUT + 1000,
    maxWorkers: '80%',
    pool: 'threads',
    restoreMocks: true,
    retry: 1,
    // Increasing the number so functions using TEST_TIMEOUT can timeout before the test does.
    testTimeout: TEST_TIMEOUT + 1000,
    env: {
      SKU_CSP_NONCE: 'RANDOM_NONCE',
    },
    projects: [
      // Isolate babel-plugin-display-name tests as our snapshot serializers interfere with their
      // snapshot output.
      {
        test: {
          name: 'babel-plugin-display-name',
          include: [`${babelPluginDisplayNameTests}/${defaultInclude}`],
        },
      },
      {
        test: {
          name: 'unit',
          pool: 'vmThreads',
          setupFiles: './vitest-setup.ts',
          include: [`packages/${defaultInclude}`, `private/${defaultInclude}`],
          exclude: [babelPluginDisplayNameTests],
        },
      },
      // Integration tests spawn sku processes, dev servers and browsers, so they
      // need the process-level isolation of forks.
      {
        test: {
          name: 'node',
          pool: 'forks',
          setupFiles: './vitest-setup.ts',
          include: [`tests/node/${defaultInclude}`],
        },
      },
      {
        test: {
          name: 'browser',
          pool: 'forks',
          setupFiles: './vitest-setup.ts',
          include: [`tests/browser/${defaultInclude}`],
        },
      },
    ],
  },
});
