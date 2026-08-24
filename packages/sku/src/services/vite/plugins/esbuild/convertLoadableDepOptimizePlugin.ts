import type { Plugin } from 'rolldown';
import { makePluginName } from '../../helpers/makePluginName.js';
import { WEBPACK_LOADABLE_IMPORT } from '../preloadPlugin/helpers/constants.js';
import {
  createWebpackLoadableImportMessage,
  rewriteWebpackLoadableImports,
} from '../preloadPlugin/helpers/rewriteWebpackLoadableImports.js';

interface PluginOptions {
  /**
   * Convert loadable import from webpack to vite. Any webpack specifier that
   * remains after the rewrite is still reported.
   */
  convertFromWebpack?: boolean;
}

// Dep optimization only runs on start, so leftovers are always warnings here.
// Production builds see dependency source through the preload plugin's transform.
export const convertLoadableDepOptimizePlugin = ({
  convertFromWebpack,
}: PluginOptions = {}): Plugin => ({
  name: makePluginName('convert-loadable-dep-optimize'),
  transform: {
    filter: {
      id: /\.[cm]?js$/,
      code: WEBPACK_LOADABLE_IMPORT,
    },
    handler(code, id) {
      if (!convertFromWebpack) {
        this.warn(createWebpackLoadableImportMessage(id));
        return null;
      }

      const result = rewriteWebpackLoadableImports(code, id);
      if ((result?.code ?? code).includes(WEBPACK_LOADABLE_IMPORT)) {
        this.warn(createWebpackLoadableImportMessage(id));
      }
      return result;
    },
  },
});
