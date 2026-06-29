import type { Plugin } from 'vite';
import { makePluginName } from '../helpers/makePluginName.js';

/**
 * Conditionally strips `server.watch` config during builds. This prevents the Vanilla Extract
 * compiler's internal Vite dev server from instantiating a persistent chokidar watcher that
 * keeps the Node event loop alive after the build completes.
 *
 * We must explicitly return `{ server: { watch: null } }` rather than just setting an empty
 * `config.server`. Setting an empty `server` config alone is not enough because:
 *   1. Plugin `config` hooks run in order and their return value is merged in with
 *      "overrides win" semantics. Even if we override `config.server`, the merge of our
 *      return value (`{}`) over the previous state cannot unset fields.
 *   2. If `config.server` ends up undefined, Vite falls back to defaults and still creates
 *      a chokidar watcher.
 * Returning `watch: null` is the explicit signal that disables the watcher.
 */
export function stripServerConfigPlugin({ apply }: { apply: boolean }): Plugin {
  return {
    name: makePluginName('strip-server-config'),
    enforce: 'post',
    apply: () => apply,
    config: (cfg) => {
      cfg.server ??= {};
      cfg.server.watch = null;

      return cfg;
    },
  };
}
