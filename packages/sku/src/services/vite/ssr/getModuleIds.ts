import { getChunkName } from '@vocab/vite/chunks';

import type { SkuRouteHandle } from './types.js';

export const getModuleIds = (
  matches: Array<{
    route: { handle?: unknown; lazy?: unknown; path?: string };
  }>,
  {
    development,
    requestLanguage,
  }: {
    development: boolean;
    requestLanguage?: string;
  },
): string[] => {
  const moduleIds = matches.flatMap(({ route }) => {
    const moduleId = (route.handle as SkuRouteHandle | undefined)?.moduleId;
    if (development && route.lazy && !moduleId) {
      console.warn(
        `[sku] Lazy route at "${String(route.path ?? '(index)')}" is missing handle.moduleId. Prefer idiomatic lazy: () => import('./pages/about/about') so sku can auto-derive it, or set handle.moduleId explicitly to the Vite client manifest key (e.g. "src/pages/about/about.tsx") for production modulepreload links.`,
      );
    }
    return moduleId ? [moduleId] : [];
  });

  // Vocab chunk only when getLanguage returns language — no allowlist / sole-language default.
  if (requestLanguage) {
    moduleIds.push(getChunkName(requestLanguage));
  }

  return moduleIds;
};
