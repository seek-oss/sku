import { describe, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import { dirContentsToObject } from '@sku-private/test-utils';
import { scopeToFixture, waitFor } from '@sku-private/testing-library';

const port = 9876;
const devServerUrl = `http://localhost:${port}`;

const { exec, joinPath } = scopeToFixture('sku-webpack-plugin');

describe('sku-webpack-plugin', () => {
  describe('start', () => {
    it('should start a development server', async ({ expect }) => {
      const server = await exec('node_modules/.bin/webpack-dev-server', [
        '--mode',
        'development',
      ]);
      expect(await server.findByError('Project is running')).toBeInTheConsole();

      const snapshot = await getAppSnapshot({
        url: devServerUrl,
        expect,
      });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    it('should generate the expected files', async ({ expect }) => {
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
        expect(build.hasExit()).toMatchObject({
          exitCode: 0,
        });
      });

      const files = await dirContentsToObject(joinPath('dist'));
      expect(files).toMatchSnapshot();
    });
  });
});
