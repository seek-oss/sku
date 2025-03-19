import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { SkuContext } from '@/context/createSkuContext.js';
import { getBuildRoutes } from '@/services/webpack/config/plugins/createHtmlRenderPlugin.js';
import { createCollector } from '@/services/vite/loadable/collector.js';
import { ensureTargetDirectory } from '@/utils/buildFileUtils.js';
import { createPreRenderedHtml } from './html/createPreRenderedHtml.js';

const resolve = (p: string) => path.resolve(process.cwd(), p);

export const prerenderRoutes = async (skuContext: SkuContext) => {
  const allRoutes = getBuildRoutes(skuContext);
  const manifest = JSON.parse(
    await readFile(resolve('./dist/.vite/manifest.json'), 'utf-8'),
  );
  for (const route of allRoutes) {
    const render = (await import(resolve('./dist/render/render.js'))).default;
    const loadableCollector = createCollector({
      manifest,
      base: skuContext.publicPath.startsWith('/') ? '/' : '',
    });

    const html = await createPreRenderedHtml({
      ...route,
      libraryFile: skuContext.libraryFile,
      libraryName: skuContext.libraryName,
      render,
      hooks: {
        getBodyTags: () => loadableCollector.getAllScripts(),
        getHeadTags: () => loadableCollector.getAllPreloads(),
      },
      collector: loadableCollector,
    });

    const getFileName = (skuRoute: ReturnType<typeof getBuildRoutes>[0]) => {
      let renderDirectory = skuContext.skuConfig.target;
      const relativeFilePath = skuContext.transformOutputPath(skuRoute);
      const includesHtmlInFilePath = relativeFilePath.endsWith('.html');
      if (!path.isAbsolute(renderDirectory)) {
        renderDirectory = path.resolve(renderDirectory);
      }
      return includesHtmlInFilePath
        ? path.join(renderDirectory, relativeFilePath)
        : path.join(renderDirectory, relativeFilePath, 'index.html');
    };

    const filePath = getFileName(route);
    await ensureTargetDirectory(filePath.split('/').slice(0, -1).join('/'));
    try {
      await writeFile(resolve(filePath), html);
    } catch (e) {
      console.error('Error writing file', filePath, e);
    }

    // Make this a nicer log.
    console.log(
      `Static Site Generation for route: ${route.route} to ${filePath}`,
    );
  }
};
