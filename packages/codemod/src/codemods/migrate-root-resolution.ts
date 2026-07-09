import { parseAsync, Lang } from '@ast-grep/napi';
import type { Transform } from '../utils/types.js';
import { addPathAlias } from '../utils/skuConfig.js';

const SUBPATH_IMPORT = '#src/*';
const SUBPATH_DESTINATION = './src/*';

const SKU_CONFIG_REGEX = /(?:^|[\\/])sku\.config\.(?:[cm]?[jt]sx?)$/;

export const transform: Transform = async (source, filePath) => {
  if (SKU_CONFIG_REGEX.test(filePath)) {
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
                any: [
                  { kind: 'import' },
                  { regex: '^require$' },
                  { pattern: 'vi.mock', kind: 'member_expression' },
                  { pattern: 'vi.importActual', kind: 'member_expression' },
                ],
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
