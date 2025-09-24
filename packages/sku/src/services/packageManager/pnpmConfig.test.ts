import { describe, it, vi, expect } from 'vitest';

import { validatePnpmConfig } from './pnpmConfig.js';

describe('validatePnpmConfig', () => {
  describe.for`
    hasRecommendedPnpmVersionInstalled | pnpmPluginSkuInstalled
    ${false}                           | ${false}
    ${false}                           | ${true}
    ${true}                            | ${false}
    ${true}                            | ${true}
    ${false}                           | ${false}
    ${false}                           | ${true}
    ${true}                            | ${false}
    ${true}                            | ${true}
  `(
    'when hasRecommendedPnpmVersionInstalled: $hasRecommendedPnpmVersionInstalled, pnpmPluginSkuInstalled: $pnpmPluginSkuInstalled',
    ({ hasRecommendedPnpmVersionInstalled, pnpmPluginSkuInstalled }) => {
      it('should log appropriate messages', async () => {
        const logSpy = vi
          .spyOn(global.console, 'log')
          .mockImplementation(() => {});

        await validatePnpmConfig({
          hasRecommendedPnpmVersionInstalled,
          pnpmPluginSkuInstalled,
        });

        expect(logSpy.mock.calls).toMatchSnapshot();
      });
    },
  );
});
