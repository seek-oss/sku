import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultExclude, defineConfig } from 'vitest/config';
import { TEST_TIMEOUT } from '@sku-private/test-utils/constants';

const defaultInclude = '**/*.{test,spec}.?(c|m)[jt]s?(x)';
const babelPluginDisplayNameTests = 'packages/babel-plugin-display-name';
const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Unit tests import helpers relatively from source; sku runtime imports
    // the same modules via `sku/runtime`. Without this alias Vitest resolves the
    // package export to dist and splits React context / ALS identity.
    alias: {
      'sku/runtime': path.join(repoRoot, 'packages/sku/src/runtime.ts'),
    },
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
    setupFiles: './vitest-setup.ts',
    // Increasing the number so functions using TEST_TIMEOUT can timeout before the test does.
    testTimeout: TEST_TIMEOUT + 1000,
    env: {
      SKU_CSP_NONCE: 'RANDOM_NONCE',
    },
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
