import { parseTsx } from './_shared/index.js';
import type { Transform } from '../utils/types.js';

/**
 * Transforms generic type arguments on `.resolves`/`.rejects` expect chains to
 * use the `satisfies` operator instead, since Vitest doesn't support generics
 * on async matchers.
 *
 * e.g. `expect(x).resolves.toEqual<MyType>({})` → `expect(x).resolves.toEqual({} satisfies MyType)`
 */
export const transform: Transform = async (source) => {
  const ast = await parseTsx(source);
  const root = ast.root();

  const expectChainGenerics = root.findAll({
    rule: {
      any: [
        {
          pattern:
            'expect($EXPECT_ARG).resolves.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).rejects.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).not.resolves.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).not.rejects.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).resolves.not.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'expect($EXPECT_ARG).rejects.not.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        // Patterns with await keyword
        {
          pattern:
            'await expect($EXPECT_ARG).resolves.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).rejects.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).not.resolves.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).not.rejects.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).resolves.not.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
        {
          pattern:
            'await expect($EXPECT_ARG).rejects.not.$MATCHER<$$$GENERIC_ARGS>($$$MATCHER_ARGS)',
        },
      ],
    },
  });

  if (expectChainGenerics.length === 0) {
    return null;
  }

  const edits = expectChainGenerics.flatMap((node) => {
    const expectArg = node.getMatch('EXPECT_ARG')?.text();
    const matcher = node.getMatch('MATCHER')?.text();

    // Use getMultipleMatches for multi-token patterns - works correctly where getMatch fails
    const genericArgsNodes = node.getMultipleMatches('GENERIC_ARGS');
    const matcherArgsNodes = node.getMultipleMatches('MATCHER_ARGS');

    if (!expectArg || !matcher || genericArgsNodes.length === 0) {
      return [];
    }

    const genericArgs = genericArgsNodes[0]?.text();
    if (!genericArgs) {
      return [];
    }

    // Filter out comma separators from the matched arguments
    const actualArgs = matcherArgsNodes.filter(
      (argNode) => argNode.text() !== ',',
    );

    if (actualArgs.length === 0) {
      return [];
    }

    const fullText = node.text();
    const beforeGeneric = fullText.substring(0, fullText.indexOf('<'));
    const argText = actualArgs[0].text();

    return [
      node.replace(`${beforeGeneric}(${argText} satisfies ${genericArgs})`),
    ];
  });

  if (edits.length === 0) {
    return null;
  }

  return root.commitEdits(edits);
};
