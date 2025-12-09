import { beforeAll, describe, expect, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/playwright';
import { dirContentsToObject } from '@sku-private/test-utils';
import { scopeToFixture, waitFor } from '@sku-private/testing-library';

const port = 9876;
const devServerUrl = `http://localhost:${port}`;

const { exec, fixturePath } = scopeToFixture('sku-webpack-plugin');

describe('sku-webpack-plugin', () => {
  describe('start', () => {
    it('should start a development server', async () => {
      const server = await exec('node_modules/.bin/webpack-dev-server', [
        '--mode',
        'development',
      ]);
      expect(await server.findByError('Project is running')).toBeInTheConsole();

      const snapshot = await getAppSnapshot({
        url: devServerUrl,
      });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
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
      await waitFor(async () => {
        const hasExit = build.hasExit();
        if (!hasExit || hasExit.exitCode !== 0) {
          throw new Error('Build exited without code 0');
        }
      });
    });

    it('should create valid app', async () => {
      const assetServer = await exec('pnpm', ['run', 'start:asset-server']);
      expect(await assetServer.findByText('serving dist')).toBeInTheConsole();

      const app = await getAppSnapshot({ url: devServerUrl });
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(fixturePath('dist'));
      expect(files).toMatchSnapshot();
    });
  });
});
