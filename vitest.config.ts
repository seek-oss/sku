import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'puppeteer',
    setupFiles: ['./vite-test-utils/vitest-setup.ts'],
    globalSetup:
      'node_modules/vitest-environment-puppeteer/dist/global-init.js',
    hookTimeout: 10000,
    testTimeout: 10000,
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
