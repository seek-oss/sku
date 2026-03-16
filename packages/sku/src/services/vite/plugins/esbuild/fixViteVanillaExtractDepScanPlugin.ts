import type { RolldownPluginOption } from 'rolldown';
import { cssFileFilter } from '@vanilla-extract/integration';
import { makePluginName } from '../../helpers/makePluginName.js';
import { dirname } from 'node:path';

export const fixViteVanillaExtractDepScanPlugin = (): RolldownPluginOption => ({
  name: makePluginName('fix-vanilla-extract-dep-scan'),

  // ! not sure if this is the correct vite@8 way to do this.
  resolveId(source, importer) {
    if (cssFileFilter.test(source)) {
      const id = require.resolve(source, {
        paths: importer ? [dirname(importer)] : undefined,
      });

      return {
        id,
        // keep the absolute path of the css file so its externalized correctly.
        external: 'absolute',
      };
    }
    return null;
  },
});
