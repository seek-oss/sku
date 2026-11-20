import type { Plugin } from 'rolldown';
import {
  assertionSearchTerms,
  resolveOptions,
  transform,
  type UnassertOptions,
} from './unassert.ts';
import { viteDiscardsSourcemaps } from './vite.ts';

export { defaultOptions, transform } from './unassert.ts';
export type {
  TransformOptions,
  TransformResult,
  UnassertOptions,
} from './unassert.ts';

type StringFilter = string | RegExp | Array<string | RegExp>;

export interface UnassertPluginOptions extends UnassertOptions {
  /**
   * The IDs of the modules to transform.
   * @default /\.[cm]?[jt]sx?(?:$|\?)/
   */
  include?: StringFilter;
  /**
   * The IDs of the modules to skip.
   * By default, the plugin transforms dependencies the same as other modules.
   */
  exclude?: StringFilter;
  /**
   * Generate source maps.
   * In a Vite build with `build.sourcemap: false`, the plugin does not generate them.
   * Source maps cause most of the cost of the plugin.
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

export function unassert(options: UnassertPluginOptions = {}): Plugin {
  const {
    include = DEFAULT_INCLUDE,
    exclude,
    sourcemap = true,
    rawTransfer,
    ...unassertOptions
  } = options;
  const resolvedOptions = resolveOptions(unassertOptions);

  return {
    name: 'unassert',
    transform: {
      filter: {
        id: { include, exclude },
        code: { include: assertionSearchTerms(resolvedOptions.variables) },
      },

      handler(code, id, meta) {
        const language = meta?.moduleType ?? languageFromId(id);
        if (!isSupportedLanguage(language)) {
          return null;
        }

        try {
          return transform(code, id, resolvedOptions, {
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
