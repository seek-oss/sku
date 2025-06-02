import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export const TEST_TIMEOUT = 50_000;

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'puppeteer',
    setupFiles: ['./vite-test-utils/vitest-setup.ts'],
    globalSetup: 'vitest-environment-puppeteer/global-init',
    // Increasing the number so functions using TEST_TIMEOUT can timeout before the test does.
    hookTimeout: TEST_TIMEOUT + 1000,
    testTimeout: TEST_TIMEOUT + 1000,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
      '**/fixtures/**',
    ],
  },
});
