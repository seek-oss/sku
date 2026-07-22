import type { Plugin } from 'vite';
import { makePluginName } from '../../helpers/makePluginName.js';
import { injectLazyRouteModuleId } from './injectLazyRouteModuleId.js';

const include = /\.(jsx?|tsx?)$/;

/**
 * Auto-derive `handle.moduleId` for idiomatic React Router lazy routes:
 * `lazy: () => import('./pages/about')`.
 *
 * Only runs in the Vite SSR environment. Never rewrites the `lazy` body,
 * never overwrites an explicit `moduleId`, and skips non-idiomatic shapes.
 */
export function lazyRouteModuleIdPlugin(): Plugin {
  return {
    name: makePluginName('lazy-route-module-id'),
    async transform(code, id) {
      if (this.environment?.name !== 'ssr') {
        return null;
      }

      if (!include.test(id)) {
        return null;
      }

      const result = injectLazyRouteModuleId({ code, id });
      if (!result) {
        return null;
      }

      return {
        code: result.code,
        map: result.map ?? undefined,
      };
    },
  };
}
