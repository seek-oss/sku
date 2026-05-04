import { parseTsx } from '../utils/parse.js';
import type { Transform } from '../utils/types.js';

/**
 * Transforms `jest.setTimeout(t)` to `vi.setConfig({ testTimeout: t })`.
 */
export const transform: Transform = async (source) => {
  const ast = await parseTsx(source);
  const root = ast.root();

  const jestSetTimeoutCalls = root.findAll({
    rule: {
      pattern: 'jest.setTimeout($TIMEOUT)',
      kind: 'call_expression',
    },
  });

  if (jestSetTimeoutCalls.length === 0) {
    return null;
  }

  const edits = jestSetTimeoutCalls.flatMap((node) => {
    const timeoutArg = node.getMatch('TIMEOUT')?.text();
    return timeoutArg
      ? [node.replace(`vi.setConfig({ testTimeout: ${timeoutArg} })`)]
      : [];
  });

  return root.commitEdits(edits);
};
