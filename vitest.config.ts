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
    restoreMocks: true,
    retry: 1,
    // Increasing the number so functions using TEST_TIMEOUT can timeout before the test does.
    testTimeout: TEST_TIMEOUT + 1000,
    env: {
      SKU_CSP_NONCE: 'RANDOM_NONCE',
    },
    projects: [
      {
        test: {
          name: 'node',
          setupFiles: './vitest-setup.ts',
          include: [
            `packages/${defaultInclude}`,
            `private/${defaultInclude}`,
            `tests/node/${defaultInclude}`,
          ],
          exclude: [babelPluginDisplayNameTests],
        },
      },
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
          name: 'browser',
          setupFiles: './vitest-setup.ts',
          include: [`tests/browser/${defaultInclude}`],
        },
      },
    ],
  },
});
