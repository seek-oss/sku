import { parseTsx } from './_shared/index.js';
import type { Transform } from '../utils/types.js';

/**
 * Replaces `jest.<method>` member expressions with `vi.<method>`.
 *
 * Excludes `jest.requireActual`, `jest.setTimeout`, and `jest.fn` with type
 * arguments — those are handled by dedicated steps.
 */
export const transform: Transform = async (source) => {
  const ast = await parseTsx(source);
  const root = ast.root();

  const jestMethods = root.findAll({
    rule: {
      pattern: 'jest.$METHOD',
      kind: 'member_expression',
      not: {
        any: [
          { pattern: 'jest.requireActual' },
          { pattern: 'jest.setTimeout' },
          {
            pattern: 'jest.fn',
            inside: {
              kind: 'call_expression',
              has: {
                kind: 'type_arguments',
              },
            },
          },
        ],
      },
    },
  });

  if (jestMethods.length === 0) {
    return null;
  }

  const edits = jestMethods.flatMap((node) => {
    const methodArg = node.getMatch('METHOD')?.text();
    return methodArg ? [node.replace(`vi.${methodArg}`)] : [];
  });

  return root.commitEdits(edits);
};
