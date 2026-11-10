import { glob, readFile } from 'node:fs/promises';
import { describe, it, type ExpectStatic } from 'vitest';
import { getPort } from '@sku-private/test-utils';
import { scopeToFixture } from '@sku-private/testing-library';

const { sku, node, fixturePath } = scopeToFixture('dist-subfolders');

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

const bundlers = [
  {
    bundler: 'vite',
    config: 'sku.config.ts',
    legacyConfig: 'sku.config.legacy.ts',
    publicHtmlConfig: 'sku.config.publicHtml.ts',
    clientChunk: /^vite-client-[\w-]{8}\.js$/,
    // Only Vite supports header CSP delivery, which writes metadata files
    metadataFiles: true,
  },
  {
    bundler: 'webpack',
    config: 'sku.config.webpack.ts',
    legacyConfig: 'sku.config.webpackLegacy.ts',
    publicHtmlConfig: 'sku.config.webpackPublicHtml.ts',
    clientChunk: /^main-[a-f0-9]{20}\.js$/,
    metadataFiles: false,
  },
] as const;

describe('dist subfolders', () => {
  describe.each(bundlers)(
    '$bundler build',
    ({
      config,
      legacyConfig,
      publicHtmlConfig,
      clientChunk,
      metadataFiles,
    }) => {
      it('should write rendered documents and client files for each environment', async ({
        expect,
      }) => {
        const build = await sku('build', ['--config', config]);
        await expect(build).toMatchExitCode(0);

        const rendered = await listFiles('dist/rendered');
        const expectedDocuments = [
          'production/about/index.html',
          'production/index.html',
          'staging/about/index.html',
          'staging/index.html',
        ];
        expect(rendered).toEqual(
          metadataFiles
            ? expectedDocuments.flatMap((file) => [file, `${file}.json`]).sort()
            : expectedDocuments,
        );

        const client = await listFiles('dist/client');
        expect(client).toEqual(
          expect.arrayContaining([
            'nested/data.txt',
            'robots.txt',
            expect.stringMatching(clientChunk),
          ]),
        );
        expect(client.some((file) => file.endsWith('.html'))).toBe(false);
        expect(client.some((file) => file.startsWith('.vite'))).toBe(false);
        expect(client.some((file) => file.endsWith('render.js'))).toBe(false);

        // Only `client` and `rendered`; no `.vite`, `render`, etc.
        expect(await listTopLevel('dist')).toEqual(['client', 'rendered']);

        const html = await readFile(
          fixturePath('dist/rendered/production/index.html'),
          'utf-8',
        );
        expect(html).toMatch(/\/static\/(vite-client|main)-/);
      });

      it('should keep the legacy layout when the option is off', async ({
        expect,
      }) => {
        const build = await sku('build', ['--config', legacyConfig]);
        await expect(build).toMatchExitCode(0);

        const files = await listFiles('dist');
        expect(files).toEqual(
          expect.arrayContaining([
            'production/index.html',
            'staging/about/index.html',
            'robots.txt',
            'nested/data.txt',
          ]),
        );
        expect(files.some((file) => file.startsWith('rendered/'))).toBe(false);
        expect(files.some((file) => file.startsWith('client/'))).toBe(false);
      });

      it('should remove stale output from a previous legacy build', async ({
        expect,
      }) => {
        const legacyBuild = await sku('build', ['--config', legacyConfig]);
        await expect(legacyBuild).toMatchExitCode(0);
        expect(await listFiles('dist')).toContain('production/index.html');

        const build = await sku('build', ['--config', config]);
        await expect(build).toMatchExitCode(0);

        expect(await listTopLevel('dist')).toEqual(['client', 'rendered']);
      });

      it('should fail before building when public contains HTML', async ({
        expect,
      }) => {
        const build = await sku('build', ['--config', publicHtmlConfig]);
        await expect(build).toMatchExitCode(1);

        const output = [...build.stdoutArr, ...build.stderrArr]
          .map(({ contents }) => contents.toString())
          .join('\n');
        expect(output).toContain('HTML files must not be in the public folder');
        expect(output).toContain('legacy.html');
      });
    },
  );

  it('should write documents without an environment segment when no environments are configured', async ({
    expect,
  }) => {
    const build = await sku('build', [
      '--config',
      'sku.config.noEnvironments.ts',
    ]);
    await expect(build).toMatchExitCode(0);

    expect(await listFiles('dist/rendered')).toEqual([
      'about/index.html',
      'about/index.html.json',
      'index.html',
      'index.html.json',
    ]);

    const client = await listFiles('dist/client');
    expect(client).toContain('robots.txt');
    expect(client.some((file) => file.endsWith('.html'))).toBe(false);

    expect(await listTopLevel('dist')).toEqual(['client', 'rendered']);
  });

  describe('serve', () => {
    const serveAndFetch = async ({
      config,
      environment,
      publicPath,
      // The legacy `publicPath` rewrite can't serve nested assets.
      checkNestedAsset = true,
      expect,
    }: {
      config: string;
      environment?: string;
      publicPath: string;
      checkNestedAsset?: boolean;
      expect: ExpectStatic;
    }) => {
      const build = await sku('build', ['--config', config]);
      await expect(build).toMatchExitCode(0);

      const port = await getPort();
      const serve = await sku('serve', [
        '--config',
        config,
        '--strict-port',
        `--port=${port}`,
        ...(environment ? ['--environment', environment] : []),
      ]);
      expect(await serve.findByText('Server started')).toBeInTheConsole();

      const url = `http://localhost:${port}`;
      const home = await fetch(`${url}/`);
      expect(home.status).toBe(200);
      expect(await home.text()).toContain('Route:');

      const about = await fetch(`${url}/about`);
      expect(about.status).toBe(200);

      const robots = await fetch(`${url}${publicPath}robots.txt`);
      expect(robots.status).toBe(200);
      expect(await robots.text()).toBe('User-agent: *\nDisallow:\n');

      if (checkNestedAsset) {
        const nested = await fetch(`${url}${publicPath}nested/data.txt`);
        expect(nested.status).toBe(200);
        expect(await nested.text()).toBe('nested public asset\n');
      }

      const missing = await fetch(`${url}${publicPath}missing.js`);
      expect(missing.status).toBe(404);

      return { home, about };
    };

    it('should serve routes, assets and CSP headers with environments and a publicPath', async ({
      expect,
    }) => {
      const { home, about } = await serveAndFetch({
        config: 'sku.config.ts',
        environment: 'production',
        publicPath: '/static/',
        expect,
      });

      expect(home.headers.get('content-security-policy')).toContain(
        "script-src 'self'",
      );
      expect(about.headers.get('content-security-policy')).toContain(
        "script-src 'self'",
      );
    });

    it('should serve routes and assets with no environments and a root publicPath', async ({
      expect,
    }) => {
      const { home } = await serveAndFetch({
        config: 'sku.config.noEnvironments.ts',
        publicPath: '/',
        expect,
      });

      expect(home.headers.get('content-type')).toContain('text/html');
    });

    it('should serve a webpack build with the subfolder layout', async ({
      expect,
    }) => {
      const { home } = await serveAndFetch({
        config: 'sku.config.webpack.ts',
        environment: 'production',
        publicPath: '/static/',
        expect,
      });

      expect(home.headers.get('content-type')).toContain('text/html');
    });

    it.for(['sku.config.legacy.ts', 'sku.config.webpackLegacy.ts'])(
      'should still serve the legacy layout (%s)',
      async (config, { expect }) => {
        const { home } = await serveAndFetch({
          config,
          environment: 'production',
          publicPath: '/static/',
          checkNestedAsset: false,
          expect,
        });

        expect(home.headers.get('content-type')).toContain('text/html');
      },
    );
  });

  describe('webpack ssr', () => {
    it('should write client files to client/ and the server bundle and stats to server/', async ({
      expect,
    }) => {
      const build = await sku('build-ssr', [
        '--config',
        'sku.config.webpackSsr.ts',
      ]);
      await expect(build).toMatchExitCode(0);

      expect(await listTopLevel('dist')).toEqual(['client', 'server']);

      const client = await listFiles('dist/client');
      expect(client).toEqual(
        expect.arrayContaining([
          'nested/data.txt',
          'robots.txt',
          expect.stringMatching(/^main-[a-f0-9]{20}\.js$/),
        ]),
      );
      expect(client).not.toContain('webpackStats.json');

      expect(await listFiles('dist/server')).toEqual([
        'server.cjs',
        'webpackStats.json',
      ]);

      const port = await getPort();
      const server = await node([
        'dist/server/server.cjs',
        '--port',
        String(port),
      ]);
      expect(
        await server.findByText(`Server started on port ${port}`),
      ).toBeInTheConsole();

      const response = await fetch(`http://localhost:${port}/`);
      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('Route:');
      expect(html).toContain('/static/main-');
    });
  });
});
