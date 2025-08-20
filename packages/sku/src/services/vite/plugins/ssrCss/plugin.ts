import type { Plugin, ViteDevServer } from 'vite';
import { collectStyle } from './collect.js';

const PLUGIN_NAME = 'vite-plugin-ssr-css';
const VIRTUAL_ENTRY = 'virtual:ssr-css.css';

/**
 * This plugin provides virtual:ssr-css.css to collect styles reachable from entries.
 * When using ViteDevServer.transformIndexHtml, it will inject <link rel="stylesheet" href="/@id/__x00__virtual:ssr-css.css" /> to <head>.
 *
 * This plugin has been forked from `hi-ogawa/vite-plugins`, with some adjustments to make it work with Sku + Braid.
 * @see https://github.com/hi-ogawa/vite-plugins/blob/main/packages/ssr-css/README.md
 */
export function vitePluginSsrCss(pluginOpts: { entries: string[] }): Plugin {
  let server: ViteDevServer;

  const virtualHref = `/@id/__x00__${VIRTUAL_ENTRY}`;

  return {
    name: PLUGIN_NAME,
    apply: 'serve',
    configureServer(server_) {
      server = server_;

      // invalidate virtual modules for each direct request
      server.middlewares.use((req, _res, next) => {
        if (req.url === virtualHref) {
          invalidateModule(server, `\0${VIRTUAL_ENTRY}?direct`);
        }
        next();
      });
    },

    // virtual module
    // (use `startsWith` since Vite adds `?direct` for raw css request)
    resolveId(source, _importer, _options) {
      return source.startsWith(VIRTUAL_ENTRY) ? `\0${source}` : undefined;
    },
    async load(id, _options) {
      if (id.startsWith(`\0${VIRTUAL_ENTRY}`)) {
        try {
          const url = new URL(id.slice(1), 'https://test.local');
          let code = await collectStyle(server, pluginOpts.entries);
          if (!url.searchParams.has('direct')) {
            code = `export default ${JSON.stringify(code)}`;
          }
          return code;
        } catch (e) {
          console.error(e);
        }
      }
      return;
    },

    // also expose via transformIndexHtml
    transformIndexHtml: {
      handler: async () => [
        {
          tag: 'link',
          injectTo: 'head',
          attrs: {
            rel: 'stylesheet',
            href: virtualHref,
            'data-ssr-css': true,
          },
        },
        {
          tag: 'script',
          injectTo: 'head',
          attrs: { type: 'module' },
          children: /* js */ `
              import { createHotContext } from "/@vite/client";
              const hot = createHotContext("/__clear_ssr_css");
              hot.on("vite:afterUpdate", () => {
                document
                  .querySelectorAll("[data-ssr-css]")
                  .forEach(node => node.remove());
              });
            `,
        },
      ],
    },
  };
}

function invalidateModule(server: ViteDevServer, id: string) {
  const mod = server.moduleGraph.getModuleById(id);
  if (mod) {
    server.moduleGraph.invalidateModule(mod);
  }
}
