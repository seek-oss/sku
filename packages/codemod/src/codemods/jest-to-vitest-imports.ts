import {
  parseTsx,
  testGlobals,
  jestGlobals,
  serializeImports,
} from './_shared/index.js';
import type { Transform } from '../utils/types.js';

/**
 * Adds or updates the `import { ... } from 'vitest'` statement based on what
 * the post-transform source actually uses. Must run last in the pipeline so that
 * all `jest.*` → `vi.*` and globals-in-scope transforms have already been applied.
 *
 * Re-derives needed names by scanning for:
 * - `vi.*` member expressions → adds `vi`
 * - Jest/Vitest test globals (`describe`, `it`, `expect`, etc.) in call position
 */
export const transform: Transform = async (source) => {
  const ast = await parseTsx(source);
  const root = ast.root();
  const vitestImports = new Set<string>();

  // Check for vi.* usage produced by earlier steps
  const viUsages = root.findAll({
    rule: {
      pattern: 'vi.$_',
      kind: 'member_expression',
    },
  });

  if (viUsages.length > 0) {
    vitestImports.add('vi');
  }

  // Find test globals that need to be imported from vitest
  const foundTestGlobals = root.findAll({
    // Matches globals like `beforeAll()`, `describe()`, `it()`, etc.
    // Also matches `test.only`, `it.skip.each`, etc.
    rule: {
      any: [
        ...jestGlobals.map((global) => ({
          pattern: global,
          kind: 'call_expression > identifier',
        })),
        ...testGlobals.map((global) => ({
          pattern: global,
          kind: 'call_expression member_expression > identifier',
        })),
      ],
    },
  });

  for (const node of foundTestGlobals) {
    vitestImports.add(node.text());
  }

  if (vitestImports.size === 0) {
    return null;
  }

  const existingVitestImports = root.findAll({
    rule: {
      kind: 'import_specifier',
      inside: {
        kind: 'import_statement',
        stopBy: 'end',
        has: {
          kind: 'string',
          regex: 'vitest',
        },
        not: {
          pattern: 'import type',
        },
      },
    },
  });

  if (existingVitestImports.length === 0) {
    const serializedImports = serializeImports(vitestImports);

    // Unsure why, but committing an edit for the vitest import causes a runtime panic, so we
    // prepend the import manually
    return `import { ${serializedImports} } from 'vitest';\n${source}`;
  }

  for (const node of existingVitestImports) {
    // This doesn't handle aliased imports, but that's a very niche case and adds complexity
    vitestImports.add(node.text());
  }

  const serializedImports = serializeImports(vitestImports);
  const namedImportsList = existingVitestImports[0].parent();

  if (!namedImportsList) {
    return null;
  }

  return root.commitEdits([
    namedImportsList.replace(`{ ${serializedImports} }`),
  ]);
};
