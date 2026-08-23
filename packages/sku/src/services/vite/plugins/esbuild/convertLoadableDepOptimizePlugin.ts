import type { Plugin } from 'rolldown';
import { makePluginName } from '../../helpers/makePluginName.js';
import { WEBPACK_LOADABLE_IMPORT } from '../preloadPlugin/helpers/constants.js';
import { rewriteWebpackLoadableImports } from '../preloadPlugin/helpers/rewriteWebpackLoadableImports.js';

export const convertLoadableDepOptimizePlugin = (): Plugin => ({
  name: makePluginName('convert-loadable-dep-optimize'),
  transform: {
    filter: {
      id: /\.[cm]?js$/,
      code: WEBPACK_LOADABLE_IMPORT,
    },
    handler(code, id) {
      return rewriteWebpackLoadableImports(code, id);
    },
  },
});
