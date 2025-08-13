import { describe, beforeAll, it, expect as globalExpect } from 'vitest';
import {
  bundlers,
  type BundlerValues,
  cleanup,
  skipCleanup,
  scopeToFixture,
} from '@sku-private/testing-library';
import fs from 'node:fs';

const timeout = 50_000;

const { sku, fixturePath } = scopeToFixture('report-generation');

describe('report-generation', () => {
  describe.sequential.for(bundlers)('bundler %s', (bundler) => {
    describe('build', async () => {
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
        webpack: [],
      };

      beforeAll(async () => {
        // Clean up any existing report folder
        const reportDir = fixturePath('report');
        if (fs.existsSync(reportDir)) {
          fs.rmSync(reportDir, { recursive: true, force: true });
        }

        const build = await sku('build', args[bundler]);
        globalExpect(
          await build.findByText('Sku build complete', {}, { timeout }),
        ).toBeInTheConsole();

        return cleanup;
      });

      it('should generate bundle analysis report', async ({ expect, task }) => {
        skipCleanup(task.id);
        const reportHtml = fixturePath('report/client.html');
        expect(fs.existsSync(reportHtml)).toBe(true);

        // Should be a substantial file (bundle analysis reports are typically large)
        const stats = fs.statSync(reportHtml);
        console.log({ stats });
        expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      });
    });
  });
});
