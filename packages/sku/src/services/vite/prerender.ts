// Pre-render the app into static HTML.
// run `npm run generate` and then `dist/static` can be served as a static site.

import fs from 'node:fs';
import path from 'node:path';
import { SkuContext } from '@/context/createSkuContext.js';
import { createPreRenderedHtml } from '@/services/vite/createPreRenderedHtml.js';
import { getBuildRoutes } from '@/services/webpack/config/plugins/createHtmlRenderPlugin.js';

const resolve = (p: string) => path.resolve(process.cwd(), p);

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

export const prerenderRoutes = async (skuContext: SkuContext) => {
  const manifest = JSON.parse(
    fs.readFileSync(resolve('./dist/.vite/manifest.json'), 'utf-8'),
  );

  const routes = getBuildRoutes(skuContext);

  for (const route of routes) {
    const render = (await import(resolve('./dist/render/render.js'))).default;
    const html = await createPreRenderedHtml({
      url: route.route,
      render,
      site: route.site,
      manifest,
    });

    const getFileName = (skuRoute: ReturnType<typeof getBuildRoutes>[0]) => {
      let renderDirectory = skuContext.skuConfig.target;
      const relativeFilePath = skuContext.transformOutputPath(skuRoute);
      const includesHtmlInFilePath = relativeFilePath.substr(-5) === '.html';
      if (!path.isAbsolute(renderDirectory)) {
        renderDirectory = path.resolve(renderDirectory);
      }
      const newFilePath = includesHtmlInFilePath
        ? path.join(renderDirectory, relativeFilePath)
        : path.join(renderDirectory, relativeFilePath, 'index.html');

      return newFilePath;
    };

    const filePath = getFileName(route);
    ensureDirectoryExistence(filePath);
    fs.writeFileSync(resolve(filePath), html);

    // Make this a nicer log.
    console.log(`Prerendered route: ${route.route} to ${filePath}`);
  }
};
