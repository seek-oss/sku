/** @type {import("eslint").Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Use the local vitest expect instead of the global or imported one.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      correctExpect:
        '`expect` should be accessed from the `it` or `test` function callback.',
      removeImport:
        '`expect` should be accessed from the `it` or `test` function callback. Only use renamed imports.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        // Check if `expect` is locally imported
        if (node.source.value === 'vitest') {
          const expectSpecifier = node.specifiers.find(
            (specifier) => specifier.local.name === 'expect',
          );
          if (expectSpecifier) {
            // Find the expect specifier. This is where eslint will report the issue.
            if (node.specifiers.length === 1) {
              context.report({
                node: expectSpecifier,
                messageId: 'removeImport',
                fix(fixer) {
                  return fixer.remove(node);
                },
              });
            } else {
              // If there are other imports, remove only `expect`
              const { sourceCode } = context;
              const newSpecifiers = node.specifiers
                .filter((specifier) => specifier.local.name !== 'expect')
                .map((specifier) => sourceCode.getText(specifier))
                .join(', ');
              context.report({
                node: expectSpecifier,
                messageId: 'removeImport',
                fix(fixer) {
                  return fixer.replaceText(
                    node,
                    `import { ${newSpecifiers} } from 'vitest';`,
                  );
                },
              });
            }
          }
        }
      },
      CallExpression(node) {
        // Check if the function call is `expect`
        if (node.callee.name === 'expect') {
          // Find the parent `it` or `test` function
          let currentNode = node;

          // Traverse up the AST to find the parent `it` or `test` function
          while (currentNode.parent) {
            currentNode = currentNode.parent;
            if (
              currentNode.type === 'CallExpression' &&
              (currentNode.callee.name === 'it' ||
                currentNode.callee.name === 'test')
            ) {
              const testCallback = currentNode.arguments[1];
              if (
                testCallback &&
                testCallback.type === 'ArrowFunctionExpression'
              ) {
                const contextParam = testCallback.params;
                if (contextParam.length === 0) {
                  // Report and autofix to add `expect` to the context object
                  context.report({
                    node,
                    messageId: 'correctExpect',
                    fix(fixer) {
                      const rangeOffset = testCallback.async ? 6 : 0;
                      return fixer.replaceTextRange(
                        [
                          testCallback.range[0] + rangeOffset,
                          testCallback.range[0] + 2 + rangeOffset,
                        ],
                        `({expect})`,
                      );
                    },
                  });

                  return; // No need to check further
                }

                if (
                  contextParam[0].type === 'ObjectPattern' &&
                  !contextParam[0].properties.some(
                    (prop) => prop.key.name === 'expect',
                  )
                ) {
                  // Report and autofix to add `expect` to the context object
                  context.report({
                    node,
                    messageId: 'correctExpect',
                    fix(fixer) {
                      const { sourceCode } = context;
                      const paramText = sourceCode.getText(contextParam[0]);
                      const newSource = `${paramText.slice(0, -1)}, expect}`;
                      return fixer.replaceText(contextParam[0], newSource);
                    },
                  });
                }
                return; // `expect` is correctly scoped
              }
            }
          }
        }
      },
    };
  },
};
