module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Use the local vitest expect instead of the global or imported one.',
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    return {
      ImportDeclaration(node) {
        // Check if `expect` is locally imported
        if (node.source.value === 'vitest') {
          const importedExpect = node.specifiers.some(
            (specifier) => specifier.local.name === 'expect',
          );
          if (importedExpect) {
            // Find the expect specifier. This is where eslint will report the issue.
            const expectSpecifier = node.specifiers.find(
              (specifier) => specifier.local.name === 'expect',
            );
            if (node.specifiers.length === 1) {
              context.report({
                node: expectSpecifier,
                message:
                  '`expect` should be accessed from the `it` or `test` function callback.',
                fix(fixer) {
                  return fixer.remove(node);
                },
              });
            } else {
              // If there are other imports, remove only `expect`
              const newSpecifiers = node.specifiers
                .filter((specifier) => specifier.local.name !== 'expect')
                .map((specifier) => specifier.local.name)
                .join(', ');
              context.report({
                node: expectSpecifier,
                message:
                  '`expect` should be accessed from the `it` or `test` function callback.',
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
                    message:
                      '`expect` should be accessed from the `it` or `test` function callback.',
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
                    message:
                      '`expect` should be accessed from the `it` or `test` function callback.',
                    fix(fixer) {
                      return fixer.replaceText(
                        contextParam[0],
                        `{${contextParam[0].properties.map((prop) => prop.key.name).join(', ')}, expect}`,
                      );
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
