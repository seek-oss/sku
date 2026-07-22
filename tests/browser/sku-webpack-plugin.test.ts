import { beforeAll, describe, expect, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';
import { dirContentsToObject, getPort } from '@sku-private/test-utils';
import {
  hasExpectedExitCode,
  scopeToFixture,
  waitFor,
} from '@sku-private/testing-library';

const { exec, fixturePath } = scopeToFixture('sku-webpack-plugin');

describe('sku-webpack-plugin', () => {
  describe('start', async () => {
    const port = await getPort();
    const devServerUrl = `http://localhost:${port}`;

    it('should start a development server', async () => {
      const server = await exec('node_modules/.bin/webpack-dev-server', [
        '--mode',
        'development',
        `--port=${port}`,
      ]);
      expect(await server.findByError('Project is running')).toBeInTheConsole();

      const snapshot = await getAppSnapshot({
        url: devServerUrl,
      });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', async () => {
    const port = await getPort();
    const url = `http://localhost:${port}`;

    beforeAll(async () => {
      const build = await exec(
        'node_modules/.bin/webpack-cli',
        ['--mode', 'production', '--no-stats'],
        {
          spawnOpts: {
            env: {
              ...process.env,
              NODE_ENV: 'production',
            },
          },
        },
      );
      await waitFor(
        () => {
          if (!hasExpectedExitCode(build, 0, false)) {
            throw new Error(
              `Expected webpack to exit with code 0 but got ${build.hasExit()?.exitCode}`,
            );
          }
        },
        { timeout: 60_000 },
      );
    }, 60_000);

    it('should create valid app', async () => {
      const assetServer = await exec('pnpm', [
        'run',
        'start:asset-server',
        `--port=${port}`,
      ]);
      expect(await assetServer.findByText('serving dist')).toBeInTheConsole();

      const app = await getAppSnapshot({ url });
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(fixturePath('dist'));
      expect(files).toMatchSnapshot();
    });
  });
});
