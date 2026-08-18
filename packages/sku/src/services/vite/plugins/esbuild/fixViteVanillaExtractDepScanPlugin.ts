import type { RolldownPluginOption } from 'rolldown';
import { cssFileFilter } from '@vanilla-extract/integration';
import { makePluginName } from '../../helpers/makePluginName.js';
import { createDebug } from 'obug';

const debug = createDebug('sku:fix-vanilla-extract-dep-scan');

// Vanilla Extract files are conventionally imported without their final extension,
// e.g. `./styles.css` resolves to `./styles.css.ts`. `cssFileFilter` only matches the
// latter, so this looser filter is used to decide which specifiers are worth resolving.
// `cssFileFilter` is then applied to the resolved path, which always has its extension.
const cssSpecifierFilter = /\.css(\.(js|cjs|mjs|jsx|ts|tsx))?(\?used)?$/;

export const fixViteVanillaExtractDepScanPlugin = (): RolldownPluginOption => ({
  name: makePluginName('fix-vanilla-extract-dep-scan'),

  resolveId: {
    filter: {
      id: cssSpecifierFilter,
    },
    async handler(source, importer) {
      const resolved = await this.resolve(source, importer);
      // If it can't be resolved, don't do anything.
      if (!resolved) {
        debug(`Could not resolve "${source}" from "${importer}"`);
        return null;
      }

      if (!cssFileFilter.test(resolved.id)) {
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
