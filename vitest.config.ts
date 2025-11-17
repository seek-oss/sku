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
    exclude: [...defaultExclude, '**/fixtures/**'],
    hookTimeout: TEST_TIMEOUT + 1000,
    maxWorkers: '80%',
    restoreMocks: true,
    retry: 1,
    setupFiles: ['./vitest-setup.ts'],
    // Increasing the number so functions using TEST_TIMEOUT can timeout before the test does.
    testTimeout: TEST_TIMEOUT + 1000,
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
        extends: true,
        test: {
          name: 'browser',
          include: [`tests/browser/${defaultInclude}`],
        },
      },
    ],
  },
});
