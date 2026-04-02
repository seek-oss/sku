import { parseAsync, Lang } from '@ast-grep/napi';
import type { Transform } from '../utils/types.js';

export const transform: Transform = async (source) => {
  const ast = await parseAsync(Lang.Tsx, source);
  const root = ast.root();

  const svgImports = root.findAll({
    rule: {
      kind: 'string_fragment',
      regex: '\.svg$',
      inside: {
        kind: 'string',
        inside: {
          kind: 'import_statement',
          stopBy: 'end',
        },
      },
    },
  });

  if (svgImports.length === 0) {
    return null;
  }

  return root.commitEdits(
    svgImports.map((s) => {
      const newImportPath = addRawQueryParam(s.text());
      return s.replace(newImportPath);
    }),
  );
};

const addRawQueryParam = (importPath: string): string => `${importPath}?raw`;
