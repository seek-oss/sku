import { parseAsync, Lang } from '@ast-grep/napi';
import type { Transform } from '../utils/types.js';
import { addPathAlias } from '../utils/skuConfig.js';

const SUBPATH_IMPORT = '#src/*';
const SUBPATH_DESTINATION = './src/*';

const SKU_CONFIG_RE = /(?:^|[\\/])sku\.config\.(?:[cm]?[jt]sx?)$/;

/**
 * Migrates `rootResolution` `src/` imports to native subpath imports.
 *
 * - In source files, rewrites `src/...` specifiers (in static/dynamic imports,
 *   re-exports and `require` calls) to `#src/...`.
 * - In the sku config, adds a `pathAliases` entry mapping `#src/*` to `./src/*`.
 *   `sku` owns the `package.json` `imports` field and keeps it in sync with
 *   `pathAliases`, so the subpath resolves natively at build time.
 */
export const transform: Transform = async (source, filePath) => {
  if (SKU_CONFIG_RE.test(filePath)) {
    return addPathAlias(source, SUBPATH_IMPORT, SUBPATH_DESTINATION);
  }

  return transformSource(source);
};

const transformSource = async (source: string): Promise<string | null> => {
  const ast = await parseAsync(Lang.Tsx, source);
  const root = ast.root();

  const specifiers = root.findAll({
    rule: {
      kind: 'string_fragment',
      regex: '^src/',
      inside: {
        kind: 'string',
        inside: {
          stopBy: 'end',
          any: [
            { kind: 'import_statement' },
            { kind: 'export_statement' },
            {
              kind: 'call_expression',
              has: {
                field: 'function',
                any: [{ kind: 'import' }, { regex: '^require$' }],
              },
            },
          ],
        },
      },
    },
  });

  if (specifiers.length === 0) {
    return null;
  }

  return root.commitEdits(
    specifiers.map((specifier) => specifier.replace(`#${specifier.text()}`)),
  );
};
