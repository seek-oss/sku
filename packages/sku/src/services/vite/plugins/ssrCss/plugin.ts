import type { Plugin, ViteDevServer } from 'vite';
import { collectStyle } from './collect.js';
import { SSR_CSS_VIRTUAL_ENTRY, SSR_CSS_VIRTUAL_HREF } from './constants.js';

export { SSR_CSS_VIRTUAL_ENTRY, SSR_CSS_VIRTUAL_HREF } from './constants.js';

const PLUGIN_NAME = 'vite-plugin-ssr-css';

/**
 * This plugin provides virtual:ssr-css.css to collect styles reachable from entries.
 * When `injectHtml` is true (static Vite), ViteDevServer.transformIndexHtml injects
 * the stylesheet link plus HMR cleanup. Vite SSR sets `injectHtml: false` and puts
 * `SSR_CSS_VIRTUAL_HREF` in Document `assets.css` instead.
 *
 * This plugin has been forked from `hi-ogawa/vite-plugins`, with some adjustments to make it work with Sku + Braid.
 * @see https://github.com/hi-ogawa/vite-plugins/blob/main/packages/ssr-css/README.md
 */
export function vitePluginSsrCss(pluginOpts: {
  entries: string[];
  /** When false, skip transformIndexHtml injection (Vite SSR Document path). Default true. */
  injectHtml?: boolean;
}): Plugin {
  let server: ViteDevServer;
  const injectHtml = pluginOpts.injectHtml !== false;

  return {
    name: PLUGIN_NAME,
    apply: 'serve',
    configureServer(server_) {
      server = server_;

      // invalidate virtual modules for each direct request
      server.middlewares.use((req, _res, next) => {
        if (req.url === SSR_CSS_VIRTUAL_HREF) {
          invalidateModule(server, `\0${SSR_CSS_VIRTUAL_ENTRY}?direct`);
        }
        next();
      });
    },

    // virtual module
    // (use `startsWith` since Vite adds `?direct` for raw css request)
    resolveId(source, _importer, _options) {
      return source.startsWith(SSR_CSS_VIRTUAL_ENTRY)
        ? `\0${source}`
        : undefined;
    },
    async load(id, _options) {
      if (id.startsWith(`\0${SSR_CSS_VIRTUAL_ENTRY}`)) {
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

    ...(injectHtml
      ? {
          // also expose via transformIndexHtml (static Vite start only)
          transformIndexHtml: {
            handler: async () => [
              {
                tag: 'link',
                injectTo: 'head',
                attrs: {
                  rel: 'stylesheet',
                  href: SSR_CSS_VIRTUAL_HREF,
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
        }
      : {}),
  };
}

function invalidateModule(server: ViteDevServer, id: string) {
  const mod = server.moduleGraph.getModuleById(id);
  if (mod) {
    server.moduleGraph.invalidateModule(mod);
  }
}
