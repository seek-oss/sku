import { parseTsx } from '../utils/parse.js';
import type { Transform } from '../utils/types.js';

/**
 * Wraps bare function references passed to lifecycle hooks in arrow functions.
 *
 * e.g. `beforeAll(someSetupFunction)` → `beforeAll(() => { someSetupFunction() })`
 *
 * Only applies when the argument is an identifier or member expression (a function
 * reference), not when it is already an arrow function or function expression.
 */
export const transform: Transform = async (source) => {
  const ast = await parseTsx(source);
  const root = ast.root();

  const lifecycleHooks = ['beforeAll', 'beforeEach', 'afterAll', 'afterEach'];

  const hookCallsWithFunctionReferences = root.findAll({
    rule: {
      any: lifecycleHooks.map((hook) => ({
        pattern: `${hook}($ARG)`,
        kind: 'call_expression',
      })),
    },
  });

  const edits = hookCallsWithFunctionReferences.flatMap((node) => {
    const arg = node.getMatch('ARG');
    if (!arg) {
      return [];
    }

    const isFunctionReference =
      arg.kind() === 'identifier' || arg.kind() === 'member_expression';

    if (!isFunctionReference) {
      return [];
    }

    return [arg.replace(`() => { ${arg.text()}() }`)];
  });

  if (edits.length === 0) {
    return null;
  }

  return root.commitEdits(edits);
};
