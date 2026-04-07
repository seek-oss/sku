import type { Plugin, ResolvedConfig } from 'vite';
import { makePluginName } from '../helpers/makePluginName.js';
import { optimize, type Config as SvgoConfig } from 'svgo';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const pluginName = makePluginName('svg-optimizer');

const NO_QUERY = Symbol('no-query');

export function svgOptimizerPlugin(svgoConfig: SvgoConfig = {}): Plugin {
  let cacheDir: string;
  let root: string;

  // Each file is optimized once regardless of query parameters.
  const optimizedPaths = new Map<string, Promise<string>>();

  let cacheDirReady: Promise<void> | undefined;
  function ensureCacheDir(): Promise<void> {
    return (cacheDirReady ??= fs
      .mkdir(cacheDir, { recursive: true })
      .then(() => undefined));
  }

  async function optimizeSvg(originalPath: string): Promise<string> {
    await ensureCacheDir();

    const content = await fs.readFile(originalPath, 'utf-8');
    const { data } = optimize(content, { path: originalPath, ...svgoConfig });

    const key = createHash('md5')
      .update(originalPath)
      .digest('hex')
      .slice(0, 8);
    const cachePath = path.join(
      cacheDir,
      `${key}-${path.basename(originalPath)}`,
    );

    await fs.writeFile(cachePath, data);
    return cachePath;
  }

  return {
    name: pluginName,
    enforce: 'pre',

    configResolved(config: ResolvedConfig) {
      root = config.root;
      cacheDir = path.join(
        config.root,
        'node_modules',
        '.cache',
        'vite-svg-opt',
      );
    },

    async resolveId(source, importer, resolveOptions) {
      if (!source.split('?')[0].endsWith('.svg')) {
        return null;
      }

      const resolved = await this.resolve(source, importer, {
        ...resolveOptions,
        skipSelf: true,
      });
      if (!resolved || resolved.external) {
        return null;
      }

      const [resolvedPath, ...queryParts] = resolved.id.split('?');
      const resolvedQuery = queryParts.length
        ? `?${queryParts.join('?')}`
        : NO_QUERY;

      if (!resolvedPath.endsWith('.svg')) {
        return null;
      }

      if (resolvedPath.startsWith(cacheDir)) {
        return null;
      }

      if (!optimizedPaths.has(resolvedPath)) {
        optimizedPaths.set(resolvedPath, optimizeSvg(resolvedPath));
        this.addWatchFile(resolvedPath);
      }

      // Optimize the file once, shared across all query variants.
      if (!optimizedPaths.has(resolvedPath)) {
        optimizedPaths.set(resolvedPath, optimizeSvg(resolvedPath));
      }
      const cachePath = await optimizedPaths.get(resolvedPath);

      return cachePath + (resolvedQuery === NO_QUERY ? '' : resolvedQuery);
    },
    configureServer(server) {
      server.watcher.on('change', async (changedFile) => {
        if (!changedFile.endsWith('.svg') || !optimizedPaths.has(changedFile)) {
          return;
        }

        const promise = optimizeSvg(changedFile);
        optimizedPaths.set(changedFile, promise);
        const cachePath = await promise;

        const url = cachePath.slice(root.length);
        const mod = await server.moduleGraph.getModuleByUrl(url);
        if (mod) {
          server.moduleGraph.invalidateModule(mod);
        }

        server.hot.send({ type: 'full-reload' });
      });
    },
  };
}
