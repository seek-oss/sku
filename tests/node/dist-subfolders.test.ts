import { glob } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import { getPort } from '@sku-private/test-utils';
import { scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('dist-subfolders');

const listFiles = async (directory: string) => {
  const files: string[] = [];
  for await (const file of glob('**/*', {
    cwd: fixturePath(directory),
    withFileTypes: true,
  })) {
    if (file.isFile()) {
      files.push(
        `${file.parentPath.slice(fixturePath(directory).length + 1)}/${file.name}`.replace(
          /^\//,
          '',
        ),
      );
    }
  }
  return files.sort();
};

const listTopLevel = async (directory: string) =>
  [
    ...new Set((await listFiles(directory)).map((file) => file.split('/')[0])),
  ].sort();

const build = async (config: string) => {
  const result = await sku('build', ['--config', config]);
  await expect(result).toMatchExitCode(0);
};

const serveAndFetch = async ({
  config,
  // The legacy `publicPath` rewrite can't serve nested assets.
  checkNestedAsset = true,
}: {
  config: string;
  checkNestedAsset?: boolean;
}) => {
  const port = await getPort();
  const serve = await sku('serve', [
    '--config',
    config,
    '--strict-port',
    `--port=${port}`,
    '--environment',
    'production',
  ]);
  expect(await serve.findByText('Server started')).toBeInTheConsole();

  const url = `http://localhost:${port}`;
  const home = await fetch(`${url}/`);
  expect(home.status).toBe(200);
  expect(await home.text()).toContain('Route:');

  const about = await fetch(`${url}/about`);
  expect(about.status).toBe(200);

  const robots = await fetch(`${url}/static/robots.txt`);
  expect(robots.status).toBe(200);
  expect(await robots.text()).toBe('User-agent: *\nDisallow:\n');

  if (checkNestedAsset) {
    const nested = await fetch(`${url}/static/nested/data.txt`);
    expect(nested.status).toBe(200);
    expect(await nested.text()).toBe('nested public asset\n');
  }

  const missing = await fetch(`${url}/static/missing.js`);
  expect(missing.status).toBe(404);

  return { home, about };
};

const bundlers = [
  {
    bundler: 'vite',
    legacyConfig: 'sku.config.legacy.ts',
    publicHtmlConfig: 'sku.config.publicHtml.ts',
  },
  {
    bundler: 'webpack',
    legacyConfig: 'sku.config.webpackLegacy.ts',
    publicHtmlConfig: 'sku.config.webpackPublicHtml.ts',
  },
] as const;

describe('dist subfolders', () => {
  describe.each(bundlers)(
    '$bundler build',
    ({ bundler, legacyConfig, publicHtmlConfig }) => {
      describe('legacy layout', () => {
        beforeAll(() => build(legacyConfig));

        it('should keep the legacy layout when the option is off', async () => {
          const files = await listFiles('dist');
          expect(files).toEqual(
            expect.arrayContaining([
              'production/index.html',
              'staging/about/index.html',
              'robots.txt',
              'nested/data.txt',
            ]),
          );
          expect(files.some((file) => file.startsWith('rendered/'))).toBe(
            false,
          );
          expect(files.some((file) => file.startsWith('client/'))).toBe(false);
        });

        it('should still serve the legacy layout', async () => {
          const { home } = await serveAndFetch({
            config: legacyConfig,
            checkNestedAsset: false,
          });

          expect(home.headers.get('content-type')).toContain('text/html');
        });

        // Replaces the legacy output, so must run after the tests above
        describe.runIf(bundler === 'vite')(
          'after switching to the default layout',
          () => {
            const config = 'sku.config.ts';

            beforeAll(() => build(config));

            it('should remove stale output from the legacy build', async () => {
              expect(await listTopLevel('dist')).toEqual([
                'client',
                'rendered',
              ]);
            });

            it('should serve routes, assets and CSP headers', async () => {
              const { home, about } = await serveAndFetch({ config });

              expect(home.headers.get('content-security-policy')).toContain(
                "script-src 'self'",
              );
              expect(about.headers.get('content-security-policy')).toContain(
                "script-src 'self'",
              );
            });
          },
        );
      });

      it('should fail before building when public contains HTML', async () => {
        const result = await sku('build', ['--config', publicHtmlConfig]);
        await expect(result).toMatchExitCode(1);

        const output = [...result.stdoutArr, ...result.stderrArr]
          .map(({ contents }) => contents.toString())
          .join('\n');
        expect(output).toContain('HTML files must not be in the public folder');
        expect(output).toContain('legacy.html');
      });
    },
  );
});
