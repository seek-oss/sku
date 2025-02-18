import fs from 'node:fs';
import path from 'node:path';
import type { SkuContext } from '@/context/createSkuContext.js';
import { getBuildRoutes } from '@/services/webpack/config/plugins/createHtmlRenderPlugin.js';
import { createPreRenderedHtml } from './html/createPreRenderedHtml.js';
import { createCollector } from '@/services/vite/preload/collector.js';

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
  const routes = getBuildRoutes(skuContext);
  const manifest = JSON.parse(
    fs.readFileSync(resolve('./dist/.vite/manifest.json'), 'utf-8'),
  );
  for (const route of routes) {
    const render = (await import(resolve('./dist/render/render.js'))).default;
    const loadableCollector = createCollector({
      manifest,
    });
    const html = await createPreRenderedHtml({
      url: route.route,
      site: route.site,
      render,
      hooks: {
        getBodyTags: () => loadableCollector.getAllScripts(),
        getHeadTags: () => loadableCollector.getAllPreloads(),
      },
    });

    const getFileName = (skuRoute: ReturnType<typeof getBuildRoutes>[0]) => {
      let renderDirectory = skuContext.skuConfig.target;
      const relativeFilePath = skuContext.transformOutputPath(skuRoute);
      const includesHtmlInFilePath = relativeFilePath.substr(-5) === '.html';
      if (!path.isAbsolute(renderDirectory)) {
        renderDirectory = path.resolve(renderDirectory);
      }
      return includesHtmlInFilePath
        ? path.join(renderDirectory, relativeFilePath)
        : path.join(renderDirectory, relativeFilePath, 'index.html');
    };

    const filePath = getFileName(route);
    ensureDirectoryExistence(filePath);
    fs.writeFileSync(resolve(filePath), html);

    // Make this a nicer log.
    console.log(
      `Static Site Generation for route: ${route.route} to ${filePath}`,
    );
  }
};
