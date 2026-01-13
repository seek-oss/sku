import type { Rule, Linter } from 'eslint';
import path from 'node:path';
import { sortPackageJson } from 'sort-package-json';

const sortRule = {
  meta: {
    docs: {
      description: 'Enforce package.json sorting',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          sortOrder: {
            type: 'array',
            minItems: 0,
            items: {
              type: 'string',
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const filename = context.filename;
    if (path.basename(filename) !== 'package.json') {
      return {};
    }

    const sourceCode = context.sourceCode;
    const options = context.options ? context.options[0] : undefined;

    return {
      ExportDefaultDeclaration(node) {
        const { declaration } = node;
        // This shouldn't happen, but just in case.
        if (declaration.type !== 'ObjectExpression') {
          return;
        }

        const packageJsonText = sourceCode.getText(declaration);
        const sortedText = sortPackageJson(packageJsonText, options);

        if (packageJsonText !== sortedText) {
          context.report({
            node,
            message: 'package.json is not sorted correctly.',
            fix(fixer) {
              return fixer.replaceText(node, sortedText);
            },
          });
        }
      },
    };
  },
} satisfies Rule.RuleModule;

/**
 * Processor for JSON files.
 * Simply prefixes the text with the `export default` so it can be parsed by eslint as javascript.
 */
export const jsonProcessor: Linter.Processor = {
  preprocess(text) {
    const prefix = 'export default ';
    return [`${prefix}${text}`];
  },
  postprocess(messages) {
    // May need to filter out messages that are not from the sort-package-json rule if we encounter extra rules running on json files.
    return messages.flat();
  },
  supportsAutofix: true,
};

export const packageJsonPlugin = {
  rules: {
    sort: sortRule,
  },
};
