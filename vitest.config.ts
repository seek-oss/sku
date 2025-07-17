import { defaultExclude, defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export const TEST_TIMEOUT = 50_000;
const defaultInclude = '**/*.{test,spec}.?(c|m)[jt]s?(x)';

/** Tests that don't need to run in the puppeteer environment */
const skuNodeTests = [
  'tests/sku-test.test.ts',
  'tests/source-maps.test.ts',
  'tests/configure.test.ts',
];

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    setupFiles: ['./test-utils/vitest/setup.ts'],
    // Increasing the number so functions using TEST_TIMEOUT can timeout before the test does.
    hookTimeout: TEST_TIMEOUT + 1000,
    testTimeout: TEST_TIMEOUT + 1000,
    exclude: [...defaultExclude, '**/fixtures/**'],
    projects: [
      {
        extends: true,
        test: {
          name: 'eslint-plugin',
          include: [`test-utils/eslint-plugin/${defaultInclude}`],
          sequence: {
            groupOrder: 0,
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'sku',
          include: [`packages/sku/${defaultInclude}`, ...skuNodeTests],
          sequence: {
            groupOrder: 0,
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'sku-puppeteer',
          environment: 'puppeteer',
          globalSetup: 'vitest-environment-puppeteer/global-init',
          include: [`tests/${defaultInclude}`],
          exclude: ['tests/sku-init/**', ...skuNodeTests],
          sequence: {
            groupOrder: 0,
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'sku-init',
          include: [`tests/sku-init/${defaultInclude}`],
          sequence: {
            // sku-init tests must run after the all other tests as it runs `pnpm install`.
            // Running it during other tests may cause dependency changes to pollute test results.
            groupOrder: 1,
          },
        },
      },
    ],
  },
});
