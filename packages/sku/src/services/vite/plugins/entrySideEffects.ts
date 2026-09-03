import type { Plugin } from 'vite';
import { exactRegex } from 'rolldown/filter';
import { createRequire } from 'node:module';

import { cwd } from '@sku-private/utils';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { makePluginName } from '../helpers/makePluginName.js';

const require = createRequire(import.meta.url);

export const ENTRY_SIDE_EFFECTS_VIRTUAL_ID = 'virtual:sku/entry-side-effects';

const isFileSpecifier = (specifier: string) =>
  specifier.startsWith('.') || specifier.startsWith('/');

export const loadEntrySideEffectsModule = (specifiers: string[]): string =>
  specifiers
    .map((specifier) => {
      // Ensure specifier is resolvable, even if not a file specifier.
      const resolved = require.resolve(specifier, { paths: [cwd()] });

      const importTarget = isFileSpecifier(specifier) ? resolved : specifier;
      return `import "${importTarget}";`;
    })
    .join('\n');

export const entrySideEffectsPlugin = (skuContext: SkuContext): Plugin => {
  const resolvedVirtualModuleId = `\0${ENTRY_SIDE_EFFECTS_VIRTUAL_ID}`;
  const moduleCode = loadEntrySideEffectsModule(skuContext.entrySideEffects);

  return {
    name: makePluginName('entry-side-effects'),
    config: () =>
      skuContext.entrySideEffects.length === 0
        ? undefined
        : {
            optimizeDeps: {
              // The virtual module is invisible to the dep scanner. Include
              // configured specifiers so first load does not 504 (Outdated
              // Optimize Dep) after discovering packages.
              include: skuContext.entrySideEffects,
            },
          },
    resolveId: {
      filter: { id: exactRegex(ENTRY_SIDE_EFFECTS_VIRTUAL_ID) },
      handler() {
        return resolvedVirtualModuleId;
      },
    },
    load: {
      filter: { id: exactRegex(resolvedVirtualModuleId) },
      handler() {
        return moduleCode;
      },
    },
  };
};
