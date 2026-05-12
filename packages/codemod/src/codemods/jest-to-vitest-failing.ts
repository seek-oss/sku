import { parseTsx } from '../utils/parse.js';
import type { Transform } from '../utils/types.js';

/**
 * Renames the `.failing` test modifier to `.fails` (the Vitest equivalent).
 */
export const transform: Transform = async (source) => {
  const ast = await parseTsx(source);
  const root = ast.root();

  const foundFailingTests = root.findAll({
    rule: {
      pattern: {
        selector: 'property_identifier',
        context: '$_OBJ.failing',
      },
    },
  });

  if (foundFailingTests.length === 0) {
    return null;
  }

  return root.commitEdits(
    foundFailingTests.map((node) => node.replace('fails')),
  );
};
