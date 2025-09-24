import type { ViteDevServer } from 'vite';

// style collection
// https://github.com/remix-run/remix/blob/1a8a5216106bd8c3073cc3e5e5399a32c981db74/packages/remix-dev/vite/styles.ts
// https://github.com/vikejs/vike/blob/f9a91f3c47cab9c2871526ef714cc0f87a41fda0/vike/node/runtime/renderPage/getPageAssets/retrieveAssetsDev.ts
// https://github.com/sveltejs/kit/blob/998edb26d431e4ee4d3b4dc792a86960a85a5b45/packages/kit/src/exports/vite/dev/index.js#L186-L219
// https://github.com/withastro/astro/blob/6aaeec5034cabf6a83e1949ec1ca8f50e7978cc1/packages/astro/src/vite-plugin-astro-server/css.ts

export async function collectStyle(server: ViteDevServer, entries: string[]) {
  const urls = await collectStyleUrls(server, entries);
  const codes = await Promise.all(
    urls.map(async (url) => {
      const res = url.includes('\0')
        ? await server.ssrLoadModule(url).then((m) => m.default)
        : await server
            .transformRequest(`${url}?direct`)
            .then((result) => result?.code);

      return [`/* [collectStyle] ${url} */`, res];
    }),
  );
  return codes.flat().filter(Boolean).join('\n\n');
}

async function collectStyleUrls(
  server: ViteDevServer,
  entries: string[],
): Promise<string[]> {
  const visited = new Set<string>();

  async function traverse(url: string) {
    const [, id] = await server.moduleGraph.resolveUrl(url);
    if (visited.has(id)) {
      return;
    }
    visited.add(id);
    const mod = server.moduleGraph.getModuleById(id);
    if (!mod) {
      return;
    }
    // Sequential traversal for depth-first behavior
    for (const childMod of mod.importedModules) {
      await traverse(childMod.url);
    }
  }

  // ensure vite's import analysis is ready _only_ for top entries to not go too aggresive
  await Promise.all(entries.map((e) => server.transformRequest(e)));

  // traverse sequentially for depth-first
  for (const url of entries) {
    await traverse(url);
  }

  // filter
  return [...visited].filter((url) => url.match(CSS_LANGS_RE));
}

// cf. https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/constants.ts#L49C23-L50
const CSS_LANGS_RE =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
