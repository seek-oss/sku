import { describe, it, vi } from 'vitest';
import { createFixture, type FileTree } from 'fs-fixture';

import { validatePnpmConfig } from './pnpmConfig.js';

describe('validatePnpmConfig', () => {
  describe.for`
    npmrcExists | hasRecommendedPnpmVersionInstalled | pnpmPluginSkuInstalled
    ${false}    | ${false}                           | ${false}
    ${false}    | ${false}                           | ${true}
    ${false}    | ${true}                            | ${false}
    ${false}    | ${true}                            | ${true}
    ${true}     | ${false}                           | ${false}
    ${true}     | ${false}                           | ${true}
    ${true}     | ${true}                            | ${false}
    ${true}     | ${true}                            | ${true}
  `(
    'when npmrcExists: $npmrcExists, hasRecommendedPnpmVersionInstalled: $hasRecommendedPnpmVersionInstalled, pnpmPluginSkuInstalled: $pnpmPluginSkuInstalled',
    ({
      npmrcExists,
      hasRecommendedPnpmVersionInstalled,
      pnpmPluginSkuInstalled,
    }) => {
      it('should log appropriate messages', async ({ expect }) => {
        const logSpy = vi
          .spyOn(global.console, 'log')
          .mockImplementation(() => {});

        const fileTree: FileTree = npmrcExists ? { '.npmrc': '' } : {};
        await using fixture = await createFixture(fileTree);

        const rootDir = fixture.path;

        await validatePnpmConfig({
          rootDir,
          hasRecommendedPnpmVersionInstalled,
          pnpmPluginSkuInstalled,
        });

        expect(logSpy.mock.calls).toMatchSnapshot();
      });
    },
  );
});
