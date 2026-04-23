import type { RolldownPluginOption } from 'rolldown';
import { cssFileFilter } from '@vanilla-extract/integration';
import { makePluginName } from '../../helpers/makePluginName.js';
import _debug from 'debug';

const debug = _debug('sku:fix-vanilla-extract-dep-scan');

export const fixViteVanillaExtractDepScanPlugin = (): RolldownPluginOption => ({
  name: makePluginName('fix-vanilla-extract-dep-scan'),

  resolveId: {
    filter: {
      id: cssFileFilter,
    },
    async handler(source, importer) {
      const resolved = await this.resolve(source, importer);
      // If it can't be resolved, don't do anything.
      if (!resolved) {
        debug(`Could not resolve "${source}" from "${importer}"`);
        return null;
      }

      return {
        id: resolved.id,
        // keep the absolute path of the css file so its externalized correctly.
        external: 'absolute',
      };
    },
  },
});
