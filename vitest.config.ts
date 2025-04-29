import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'puppeteer',
    setupFiles: ['./vite-test-utils/vitest-setup.ts'],
    globalSetup: 'vitest-environment-puppeteer/global-init',
    hookTimeout: 80000,
    testTimeout: 80000,
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
