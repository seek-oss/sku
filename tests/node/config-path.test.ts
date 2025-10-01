import { beforeEach, afterEach, describe, it } from 'vitest';
import { scopeToFixture, waitFor } from '@sku-private/testing-library';
import { unlink, writeFile } from 'node:fs/promises';

const { sku, fixturePath } = scopeToFixture('config-path');

describe('config-paths', () => {
  it('should throw if the --config flag is provided but the path is not found', async ({
    expect,
  }) => {
    const cli = await sku('build', ['--config', 'sku-not-found.config.ts']);

    expect(
      await cli.findByError(
        new RegExp(
          `Error: Sku config file not found for path: .*config-path/sku-not-found.config.ts$`,
        ),
      ),
    ).toBeInTheConsole();

    await waitFor(() => {
      expect(cli.hasExit()).toMatchObject({ exitCode: 1 });
    });
  });

  describe.each(['ts', 'js', 'mjs'])(
    'automatic config detection',
    (configExtension) => {
      const configPath = fixturePath(`sku.config.${configExtension}`);

      beforeEach(async () => {
        await writeFile(configPath, 'export default {}');
      });

      afterEach(async () => {
        await unlink(configPath);
      });

      it(`should find .${configExtension} config files`, async ({ expect }) => {
        const cli = await sku('build', [], {
          spawnOpts: {
            env: {
              ...process.env,
              DEBUG: 'sku:config',
            },
          },
        });

        expect(
          await cli.findByError(
            new RegExp(
              `Loading sku config: .*config-path/sku.config.${configExtension}$`,
            ),
          ),
        ).toBeInTheConsole();
      });
    },
  );

  it('should fallback to the default config if no sku config file is found', async ({
    expect,
  }) => {
    const cli = await sku('build', [], {
      spawnOpts: {
        env: {
          ...process.env,
          DEBUG: 'sku:config',
        },
      },
    });

    expect(
      await cli.findByError('Failed to find a supported sku.config file'),
    ).toBeInTheConsole();
    expect(
      await cli.findByError(
        'No sku config file found. Using default configuration.',
      ),
    ).toBeInTheConsole();
  });
});
