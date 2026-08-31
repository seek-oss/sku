import { describe, beforeAll, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';

import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';
import { getPort } from '@sku-private/test-utils';
import { readFile } from 'node:fs/promises';
import { parse, type HTMLElement } from 'node-html-parser';

const { sku, fixturePath, node, exec } = scopeToFixture('security-controls');

describe('security-controls', () => {
  const args: BundlerValues<string[]> = {
    vite: ['--config', 'sku.config.vite.ts'],
    webpack: ['--config', 'sku.config.ts'],
  };

  describe.for(bundlers)('bundler %s', async (bundler) => {
    describe('start', async () => {
      const port = await getPort();
      const url = `http://localhost:${port}`;

      beforeAll(async () => {
        const start = await sku('start', [
          ...args[bundler],
          '--strict-port',
          `--port=${port}`,
        ]);
        await start.findByText('Starting development server');
      });

      it('should start an app with security controls', async () => {
        const app = await getAppSnapshot({
          url,
        });
        expect(app).toMatchSnapshot();
      });
    });

    describe('build', async () => {
      let cspTag: HTMLElement;

      beforeAll(async () => {
        const build = await sku('build', [...args[bundler]]);
        await build.findByText('Sku build complete');

        const indexPath = fixturePath('dist/index.html');
        const content = await readFile(indexPath, 'utf-8');
        const root = parse(content);
        const element = root.querySelector(
          'meta[http-equiv="Content-Security-Policy"]',
        );

        if (!element) {
          throw new Error('Unable to select CSP meta element');
        }

        cspTag = element;
      });

      it('should generate a CSP meta tag', async () => {
        expect(cspTag).not.toBeNull();
      });

      it('should include the extra hosts in the CSP', async () => {
        expect(cspTag.getAttribute('content')).toContain(
          'https://some-cdn.com',
        );
      });

      it('should generate a CSP with nonce value', async () => {
        expect(cspTag.getAttribute('content')).match(/nonce-RANDOM_NONCE/);
      });
    });

    describe('serve', async () => {
      const port = await getPort();
      const url = `http://localhost:${port}`;

      beforeAll(async () => {
        const build = await sku('build', [...args[bundler]]);
        await build.findByText('Sku build complete');

        const serve = await sku('serve', [`--port=${port}`]);
        await serve.findByText('Server started');
      });

      it('should serve an app with security controls', async () => {
        const app = await getAppSnapshot({
          url,
        });
        expect(app).toMatchSnapshot();
      });
    });

    describe.runIf(bundler === 'vite')('csp-delivery', () => {
      describe('start', async () => {
        const port = await getPort();
        const url = `http://localhost:${port}`;

        beforeAll(async () => {
          const start = await sku('start', [
            '--config=sku.config.vite.csp-delivery.ts',
            '--strict-port',
            `--port=${port}`,
          ]);
          await start.findByText('Starting development server');
        });

        it('should start an app with security controls', async () => {
          const app = await getAppSnapshot({
            url,
          });
          expect(app).toMatchSnapshot();
        });
      });

      describe('build', async () => {
        let cspHeader: string;

        beforeAll(async () => {
          const build = await sku('build', [
            '--config=sku.config.vite.csp-delivery.ts',
          ]);
          await build.findByText('Sku build complete');

          const indexJsonPath = fixturePath('dist/index.html.json');
          const content = await readFile(indexJsonPath, 'utf-8');
          const data = JSON.parse(content);
          const metadata = data.metadata?.csp ?? null;

          if (!metadata) {
            throw new Error('Unable to select CSP metadata');
          }

          cspHeader = metadata;
        });

        it('should generate a CSP header', async () => {
          expect(cspHeader).not.toBeNull();
        });

        it('should include the extra hosts in the CSP', async () => {
          expect(cspHeader).toContain('https://some-cdn.com');
        });

        it('should generate a CSP with nonce value', async () => {
          expect(cspHeader).match(/nonce-RANDOM_NONCE/);
        });
      });

      describe('serve', async () => {
        const port = await getPort();
        const url = `http://localhost:${port}`;

        beforeAll(async () => {
          const build = await sku('build', [
            '--config=sku.config.vite.csp-delivery.ts',
          ]);
          await build.findByText('Sku build complete');

          const serve = await sku('serve', [`--port=${port}`]);
          await serve.findByText('Server started');
        });

        it('should serve an app with security controls', async () => {
          const app = await getAppSnapshot({
            url,
          });
          expect(app).toMatchSnapshot();
        });
      });
    });

    describe.runIf(bundler === 'vite')('csp-report-only', () => {
      describe('start', async () => {
        const port = await getPort();
        const url = `http://localhost:${port}`;

        beforeAll(async () => {
          const start = await sku('start', [
            '--config=sku.config.vite.csp-report-only.ts',
            '--strict-port',
            `--port=${port}`,
          ]);
          await start.findByText('Starting development server');
        });

        it('should start an app with security controls', async () => {
          const app = await getAppSnapshot({
            url,
          });
          expect(app).toMatchSnapshot();
        });
      });

      describe('build', async () => {
        let cspReportOnlyHeader: string;

        beforeAll(async () => {
          const build = await sku('build', [
            '--config=sku.config.vite.csp-report-only.ts',
          ]);
          await build.findByText('Sku build complete');

          const indexJsonPath = fixturePath('dist/index.html.json');
          const content = await readFile(indexJsonPath, 'utf-8');
          const data = JSON.parse(content);
          const metadata = data.metadata?.cspReportOnly ?? null;

          if (!metadata) {
            throw new Error('Unable to select report-only CSP metadata');
          }

          cspReportOnlyHeader = metadata;
        });

        it('should generate a report-only CSP header', async () => {
          expect(cspReportOnlyHeader).not.toBeNull();
        });

        it('should include the extra hosts in the report-only CSP', async () => {
          expect(cspReportOnlyHeader).toContain(
            'https://some-report-only-cdn.com',
          );
        });

        it('should generate a report-only CSP with nonce value', async () => {
          expect(cspReportOnlyHeader).match(/nonce-RANDOM_NONCE/);
        });
      });

      describe('serve', async () => {
        const port = await getPort();
        const url = `http://localhost:${port}`;

        beforeAll(async () => {
          const build = await sku('build', [
            '--config=sku.config.vite.csp-report-only.ts',
          ]);
          await build.findByText('Sku build complete');

          const serve = await sku('serve', [`--port=${port}`]);
          await serve.findByText('Server started');
        });

        it('should serve an app with security controls', async () => {
          const app = await getAppSnapshot({
            url,
          });
          expect(app).toMatchSnapshot();
        });
      });
    });

    describe.runIf(bundler === 'vite')('csp-report-to', () => {
      describe('endpoint', () => {
        describe('start', async () => {
          const port = await getPort();
          const url = `http://localhost:${port}`;

          beforeAll(async () => {
            const start = await sku('start', [
              '--config=sku.config.vite.csp-report-to.endpoint.ts',
              '--strict-port',
              `--port=${port}`,
            ]);
            await start.findByText('Starting development server');
          });

          it('should start an app with security controls', async () => {
            const app = await getAppSnapshot({
              url,
            });
            expect(app).toMatchSnapshot();
          });
        });

        describe('build', () => {
          let cspHeader: string;
          let cspReportOnlyHeader: string;
          let reportingEndpointsHeader: string;

          beforeAll(async () => {
            const build = await sku('build', [
              '--config=sku.config.vite.csp-report-to.endpoint.ts',
            ]);
            await build.findByText('Sku build complete');

            const indexJsonPath = fixturePath('dist/index.html.json');
            const content = await readFile(indexJsonPath, 'utf-8');
            const data = JSON.parse(content);

            cspHeader = data.metadata.csp;
            cspReportOnlyHeader = data.metadata.cspReportOnly;
            reportingEndpointsHeader = data.metadata.reportingEndpoints ?? null;
          });

          it('should generate a CSP with a report-to directive', () => {
            expect(cspHeader).toContain('report-to some-reporting-endpoint');
          });

          it('should generate a report-only CSP with a report-to directive', () => {
            expect(cspReportOnlyHeader).toContain(
              'report-to some-report-only-reporting-endpoint',
            );
          });

          it('should not generate a reporting-endpoints header', () => {
            expect(reportingEndpointsHeader).toBeNull();
          });
        });

        describe('serve', async () => {
          const port = await getPort();
          const url = `http://localhost:${port}`;

          beforeAll(async () => {
            const build = await sku('build', [
              '--config=sku.config.vite.csp-report-to.endpoint.ts',
            ]);
            await build.findByText('Sku build complete');

            const serve = await sku('serve', [`--port=${port}`]);
            await serve.findByText('Server started');
          });

          it('should serve an app with security controls', async () => {
            const app = await getAppSnapshot({
              url,
            });
            expect(app).toMatchSnapshot();
          });
        });
      });

      describe('url', () => {
        describe('start', async () => {
          const port = await getPort();
          const url = `http://localhost:${port}`;

          beforeAll(async () => {
            const start = await sku('start', [
              '--config=sku.config.vite.csp-report-to.url.ts',
              '--strict-port',
              `--port=${port}`,
            ]);
            await start.findByText('Starting development server');
          });

          it('should start an app with security controls', async () => {
            const app = await getAppSnapshot({
              url,
            });
            expect(app).toMatchSnapshot();
          });
        });

        describe('build', () => {
          const reportToRegExp = /report-to (?<endpoint>endpoint-[0-9a-f]{8})/;

          let cspHeader: string;
          let cspReportOnlyHeader: string;
          let reportingEndpointsHeader: string;

          beforeAll(async () => {
            const build = await sku('build', [
              '--config=sku.config.vite.csp-report-to.url.ts',
            ]);
            await build.findByText('Sku build complete');

            const indexJsonPath = fixturePath('dist/index.html.json');
            const content = await readFile(indexJsonPath, 'utf-8');
            const data = JSON.parse(content);

            cspHeader = data.metadata.csp;
            cspReportOnlyHeader = data.metadata.cspReportOnly;
            reportingEndpointsHeader = data.metadata.reportingEndpoints ?? null;
          });

          it('should generate a CSP with a report-to directive', () => {
            expect(cspHeader).toMatch(reportToRegExp);
          });

          it('should generate a report-only CSP with a report-to directive', () => {
            expect(cspReportOnlyHeader).toMatch(reportToRegExp);
          });

          it('should generate a reporting-endpoints header', () => {
            expect(reportingEndpointsHeader).not.toBeNull();
          });

          it('should include the CSP report-to endpoint in the reporting-endpoints header', () => {
            const { endpoint } = cspHeader.match(reportToRegExp)?.groups ?? {};

            expect(reportingEndpointsHeader).toContain(
              `${endpoint}="https://some-reporting-url.com"`,
            );
          });

          it('should include the report-only CSP report-to endpoint in the reporting-endpoints header', () => {
            const { endpoint } =
              cspReportOnlyHeader.match(reportToRegExp)?.groups ?? {};

            expect(reportingEndpointsHeader).toContain(
              `${endpoint}="https://some-report-only-reporting-url.com"`,
            );
          });
        });

        describe('serve', async () => {
          const port = await getPort();
          const url = `http://localhost:${port}`;

          beforeAll(async () => {
            const build = await sku('build', [
              '--config=sku.config.vite.csp-report-to.url.ts',
            ]);
            await build.findByText('Sku build complete');

            const serve = await sku('serve', [`--port=${port}`]);
            await serve.findByText('Server started');
          });

          it('should serve an app with security controls', async () => {
            const app = await getAppSnapshot({
              url,
            });
            expect(app).toMatchSnapshot();
          });
        });
      });

      describe('tuple', () => {
        describe('start', async () => {
          const port = await getPort();
          const url = `http://localhost:${port}`;

          beforeAll(async () => {
            const start = await sku('start', [
              '--config=sku.config.vite.csp-report-to.tuple.ts',
              '--strict-port',
              `--port=${port}`,
            ]);
            await start.findByText('Starting development server');
          });

          it('should start an app with security controls', async () => {
            const app = await getAppSnapshot({
              url,
            });
            expect(app).toMatchSnapshot();
          });
        });

        describe('build', () => {
          let cspHeader: string;
          let cspReportOnlyHeader: string;
          let reportingEndpointsHeader: string;

          beforeAll(async () => {
            const build = await sku('build', [
              '--config=sku.config.vite.csp-report-to.tuple.ts',
            ]);
            await build.findByText('Sku build complete');

            const indexJsonPath = fixturePath('dist/index.html.json');
            const content = await readFile(indexJsonPath, 'utf-8');
            const data = JSON.parse(content);

            cspHeader = data.metadata.csp;
            cspReportOnlyHeader = data.metadata.cspReportOnly;
            reportingEndpointsHeader = data.metadata.reportingEndpoints ?? null;
          });

          it('should generate a CSP with a report-to directive', () => {
            expect(cspHeader).toContain('report-to some-reporting-endpoint');
          });

          it('should generate a report-only CSP with a report-to directive', () => {
            expect(cspReportOnlyHeader).toContain(
              'report-to some-report-only-reporting-endpoint',
            );
          });

          it('should generate a reporting-endpoints header', () => {
            expect(reportingEndpointsHeader).not.toBeNull();
          });

          it('should include the CSP report-to endpoint in the reporting-endpoints header', () => {
            expect(reportingEndpointsHeader).toContain(
              'some-reporting-endpoint="https://some-reporting-url.com"',
            );
          });

          it('should include the report-only CSP report-to endpoint in the reporting-endpoints header', () => {
            expect(reportingEndpointsHeader).toContain(
              'some-report-only-reporting-endpoint="https://some-report-only-reporting-url.com"',
            );
          });
        });

        describe('serve', async () => {
          const port = await getPort();
          const url = `http://localhost:${port}`;

          beforeAll(async () => {
            const build = await sku('build', [
              '--config=sku.config.vite.csp-report-to.tuple.ts',
            ]);
            await build.findByText('Sku build complete');

            const serve = await sku('serve', [`--port=${port}`]);
            await serve.findByText('Server started');
          });

          it('should serve an app with security controls', async () => {
            const app = await getAppSnapshot({
              url,
            });
            expect(app).toMatchSnapshot();
          });
        });
      });
    });
  });

  describe('build-ssr', async () => {
    const port = await getPort();
    const url = `http://localhost:${port}`;

    beforeAll(async () => {
      const build = await sku('build-ssr', ['--config=sku-server.config.ts']);
      await build.findByText('Sku build complete');
    });

    it('should start a server with content-security-policies', async () => {
      await node(['dist/server.cjs', `--port=${port}`]);
      const assetServer = await exec('pnpm', ['run', 'serve:assets']);
      expect(await assetServer.findByText('serving dist')).toBeInTheConsole();

      const app = await getAppSnapshot({ url });

      expect(app).toMatchSnapshot();
    });
  });
});
