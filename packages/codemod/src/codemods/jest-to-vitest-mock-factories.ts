import type { Edit } from '@ast-grep/napi';
import { parseTsx } from '../utils/parse.js';
import type { Transform } from '../utils/types.js';

/**
 * Makes mock factory functions async and replaces `jest.requireActual` with
 * `await vi.importActual`.
 *
 * The two edits are kept in the same step because they share node selection:
 * `formal_parameters` are found by looking for `jest.requireActual` inside the
 * function, and `jest.requireActual` is then replaced. Batching them in one
 * `commitEdits` call is safe because they operate on non-overlapping ranges.
 */
export const transform: Transform = async (source) => {
  const ast = await parseTsx(source);
  const root = ast.root();
  const edits: Edit[] = [];

  const jestMockFactoryParameters = root.findAll({
    // Matching only the parameters of the function so that we can edit deeply nested functions.
    // Matching on `arrow_function` and `function_expression` _would_ match deeply nested functions,
    // but editing will fail since the top-level function will have been edited already, breaking
    // child edits.
    rule: {
      kind: 'formal_parameters',
      inside: {
        not: { pattern: 'async $$$' },
        has: {
          pattern: 'jest.requireActual',
          kind: 'member_expression',
          stopBy: 'end',
        },
      },
    },
  });

  for (const node of jestMockFactoryParameters) {
    const parent = node.parent();
    // Since we are matching on the parameters of the function we need to check
    // if the parent is a function expression (`function () {}`) so that we add `async` to the right place.
    const nodeToEdit = parent?.is('function_expression') ? parent : node;

    const {
      start: { index },
    } = nodeToEdit.range();

    edits.push({
      startPos: index,
      endPos: index,
      insertedText: 'async ',
    });
  }

  const requireActualNodes = root.findAll({
    rule: {
      pattern: 'jest.requireActual',
      kind: 'member_expression',
    },
  });

  for (const node of requireActualNodes) {
    edits.push(node.replace('await vi.importActual'));
  }

  if (edits.length === 0) {
    return null;
  }

  return root.commitEdits(edits);
};
