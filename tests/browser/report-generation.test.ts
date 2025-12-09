import { describe, beforeAll, it, expect } from 'vitest';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';
import fs from 'node:fs';
import { rm } from 'node:fs/promises';

const { sku, fixturePath } = scopeToFixture('report-generation');

describe('report-generation', () => {
  describe.for(bundlers)('bundler %s', (bundler) => {
    describe('build', async () => {
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts'],
        webpack: [],
      };

      beforeAll(async () => {
        // Clean up any existing report folder
        const reportDir = fixturePath('report');
        rm(reportDir, { recursive: true, force: true });

        const build = await sku('build', args[bundler]);
        await build.findByText('Sku build complete');
      });

      it('should generate bundle analysis report', async () => {
        const reportHtml = fixturePath('report/client.html');
        expect(fs.existsSync(reportHtml)).toBe(true);

        // Should be a substantial file (bundle analysis reports are typically large)
        const stats = fs.statSync(reportHtml);
        expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      });
    });
  });
});
