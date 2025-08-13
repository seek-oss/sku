import { describe, beforeAll, it, expect as globalExpect, vi } from 'vitest';
import {
  bundlers,
  type BundlerValues,
  cleanup,
  skipCleanup,
  scopeToFixture,
} from '@sku-private/testing-library';
import fs from 'node:fs';
import path from 'node:path';

const timeout = 50_000;

vi.setConfig({
  hookTimeout: timeout + 1000,
  testTimeout: timeout + 1000,
});

const { sku, fixturePath } = scopeToFixture('report-generation');

describe('report-generation', () => {
  describe.sequential.for(bundlers)('bundler %s', (bundler) => {
    describe('build', async () => {
      const args: BundlerValues<string[]> = {
        vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
        webpack: [],
      };

      beforeAll(async () => {
        const build = await sku('build', args[bundler]);
        globalExpect(
          await build.findByText('Sku build complete', {}, { timeout }),
        ).toBeInTheConsole();

        return cleanup;
      });

      it('should generate bundle analysis report', async ({ expect, task }) => {
        skipCleanup(task.id);
        const reportPath = fixturePath('report');
        const clientReportPath = path.join(reportPath, 'client.html');

        expect(fs.existsSync(reportPath)).toBe(true);
        expect(fs.existsSync(clientReportPath)).toBe(true);

        // Verify the report is a valid HTML file with reasonable content
        const reportContent = fs.readFileSync(clientReportPath, 'utf-8');
        const stats = fs.statSync(clientReportPath);

        expect(reportContent).toContain('<!DOCTYPE html>');
        expect(reportContent).toContain('<html');
        expect(reportContent).toContain('</html>');
        expect(reportContent).toMatch(
          /(bundle|Bundle|chart|Chart|visual|Visual)/i,
        );

        // Should be a substantial file (bundle analysis reports are typically large)
        expect(stats.size).toBeGreaterThan(1000); // At least 1KB
      });
    });
  });
});
