import { parseTsx } from '../utils/parse.js';
import type { Transform } from '../utils/types.js';

/**
 * Transforms `as jest.Mock` / `jest.MockedFunction` type casts to `vi.mocked(...)`.
 *
 * Runs before jest-methods so the `jest.Mock` member expression in type position is
 * matched intact (it is a `member_type`, not `member_expression`, but running first
 * makes the intent explicit and avoids any future parser ambiguity).
 */
export const transform: Transform = async (source) => {
  const ast = await parseTsx(source);
  const root = ast.root();

  const foundJestMockTypes = root.findAll({
    rule: {
      kind: 'as_expression',
      any: [
        { pattern: '$IDENTIFIER as jest.Mock' },
        { pattern: '$IDENTIFIER as jest.Mock<$$$_GENERIC_ARGS>' },
        { pattern: '$IDENTIFIER as jest.MockedFunction' },
        { pattern: '$IDENTIFIER as jest.MockedFunction<$$$_GENERIC_ARGS>' },
        {
          pattern:
            '$IDENTIFIER as jest.MockedFunction<$$$_GENERIC_ARGS> & $_OBJECT_TYPE',
        },
      ],
    },
  });

  if (foundJestMockTypes.length === 0) {
    return null;
  }

  const edits = foundJestMockTypes.flatMap((node) => {
    const identifier = node.getMatch('IDENTIFIER')?.text();
    return identifier ? [node.replace(`vi.mocked(${identifier})`)] : [];
  });

  return root.commitEdits(edits);
};
