import type { Plugin } from 'rolldown';
import {
  createCalleeModuleMapping,
  displayNameSearchTerms,
  transform,
  type DisplayNameOptions,
} from './transform.js';
import { viteDiscardsSourcemaps } from './vite.js';

export { defaultAllowedCallees, transform } from './transform.js';
export type {
  AllowedCallees,
  DisplayNameOptions,
  TransformOptions,
  TransformResult,
} from './transform.js';

type StringFilter = string | RegExp | Array<string | RegExp>;

export interface DisplayNamePluginOptions extends DisplayNameOptions {
  /**
   * The IDs of the modules to transform.
   * @default /\.[cm]?[jt]sx?(?:$|\?)/
   */
  include?: StringFilter;
  /**
   * The IDs of the modules to skip.
   * If you set it, you must add back the default entries that you still want to skip.
   * @default /[\\/]node_modules[\\/]|\0rolldown\/runtime\.js/
   */
  exclude?: StringFilter;
  /**
   * Generate source maps.
   * In a Vite build with `build.sourcemap: false`, the plugin does not generate them.
   * @default true
   */
  sourcemap?: boolean;
  /**
   * Use the experimental raw transfer of oxc-parser to build the AST.
   * Raw transfer is much faster.
   * The plugin ignores this option if the runtime does not support raw transfer.
   * @default true
   */
  rawTransfer?: boolean;
}

const DEFAULT_EXCLUDE = /[\\/]node_modules[\\/]|\0rolldown\/runtime\.js/;
const DEFAULT_INCLUDE = /\.[cm]?[jt]sx?(?:$|\?)/;

const SUPPORTED_LANGUAGES = ['js', 'jsx', 'ts', 'tsx'] as const;
type Language = (typeof SUPPORTED_LANGUAGES)[number];
const SUPPORTED_LANGUAGE_SET: ReadonlySet<string> = new Set(
  SUPPORTED_LANGUAGES,
);

function isSupportedLanguage(value: string | undefined): value is Language {
  return value !== undefined && SUPPORTED_LANGUAGE_SET.has(value);
}

function languageFromId(id: string): Language {
  const extension = /\.[cm]?([jt]sx?)$/.exec(id.replace(/[?#].*$/, ''))?.[1];
  return isSupportedLanguage(extension) ? extension : 'js';
}

/**
 * The plugin must see the JSX, so it must run before the transforms that compile it.
 * Vite reads `enforce`, and Rolldown ignores it.
 */
type DisplayNamePlugin = Plugin & { enforce: 'pre' };

export function displayName(
  options: DisplayNamePluginOptions = {},
): DisplayNamePlugin {
  const {
    include = DEFAULT_INCLUDE,
    exclude = DEFAULT_EXCLUDE,
    sourcemap = true,
    rawTransfer,
    ...displayNameOptions
  } = options;
  const searchTerms = displayNameSearchTerms(
    createCalleeModuleMapping(displayNameOptions.allowedCallees),
  );

  return {
    name: 'sku-display-name',
    enforce: 'pre',
    transform: {
      filter: {
        id: { include, exclude },
        code: { include: searchTerms },
      },

      handler(code, id, meta) {
        const language = meta?.moduleType ?? languageFromId(id);
        if (!isSupportedLanguage(language)) {
          return null;
        }

        try {
          return transform(code, id, displayNameOptions, {
            language,
            sourcemap: sourcemap && !viteDiscardsSourcemaps(this),
            rawTransfer,
          });
        } catch (error) {
          return this.error(error instanceof Error ? error : String(error));
        }
      },
    },
  };
}
