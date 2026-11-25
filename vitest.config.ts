import { defaultExclude, defineConfig } from 'vitest/config';
import { TEST_TIMEOUT } from '@sku-private/test-utils/constants';

const defaultInclude = '**/*.{test,spec}.?(c|m)[jt]s?(x)';
const rolldownPluginUnassertTests = 'packages/rolldown-plugin-unassert';

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
    // Only the benchmark project below has a benchmark suite.
    benchmark: { include: [] },
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
      // Benchmark run with `vitest bench`
      {
        test: {
          name: 'rolldown-plugin-unassert-benchmark',
          root: `./${rolldownPluginUnassertTests}`,
          include: [],
          globalSetup: ['./benchmark/global-setup.ts'],
          benchmark: { include: ['benchmark/**/*.bench.ts'] },
          testTimeout: 30 * 60_000,
          hookTimeout: 10 * 60_000,
        },
      },
      // unit tests don't need snapshot serializers or cli setup
      {
        test: {
          name: 'unit',
          include: [`packages/${defaultInclude}`, `private/${defaultInclude}`],
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
