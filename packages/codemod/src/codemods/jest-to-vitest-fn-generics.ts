import { parseTsx } from '../utils/parse.js';
import type { Transform } from '../utils/types.js';

/**
 * Transforms `jest.fn<ReturnType, Parameters>(...)` to the Vitest-compatible
 * `vi.fn<(...args: Parameters) => ReturnType>(...)`.
 */
export const transform: Transform = async (source) => {
  const ast = await parseTsx(source);
  const root = ast.root();

  const jestFnGenericCalls = root.findAll({
    rule: {
      pattern: 'jest.fn<$GENERIC_ARG1,$GENERIC_ARG2>($$$MATCHER_ARGS)',
      kind: 'call_expression',
    },
  });

  if (jestFnGenericCalls.length === 0) {
    return null;
  }

  const edits = jestFnGenericCalls.flatMap((node) => {
    const returnType = node.getMatch('GENERIC_ARG1')?.text();
    const parametersType = node.getMatch('GENERIC_ARG2')?.text();
    const matcherArgs = node.getMatch('MATCHER_ARGS')?.text();

    if (!returnType || !parametersType) {
      return [];
    }

    // Transform: jest.fn<ReturnType, Parameters>() -> vi.fn<(...args: Parameters) => ReturnType>()
    const args = matcherArgs ? `(${matcherArgs})` : '()';
    return [
      node.replace(
        `vi.fn<(...args: ${parametersType}) => ${returnType}>${args}`,
      ),
    ];
  });

  return root.commitEdits(edits);
};
