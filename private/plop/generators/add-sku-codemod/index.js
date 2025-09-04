const codemodRoot = '../../packages/codemod/src/';

/** @param {import('plop').NodePlopAPI} plop */
export const addSkuCodemodGenerator = (plop) => {
  plop.setGenerator('add-sku-codemod', {
    description: 'Create a new codemod for sku',
    prompts: [
      {
        type: 'input',
        name: 'codemodName',
        message: 'the name of the codemod, kebab-case',
      },
      {
        type: 'input',
        name: 'description',
        message: 'the description of the codemod',
      },
    ],
    actions: [
      {
        type: 'add',
        templateFile: './generators/add-sku-codemod/templates/transform.hbs',
        path: `${codemodRoot}/codemods/{{codemodName}}/{{codemodName}}.ts`,
      },
      {
        type: 'add',
        templateFile: './generators/add-sku-codemod/templates/test.hbs',
        path: `${codemodRoot}/codemods/{{codemodName}}/__tests__/{{codemodName}}.test.ts`,
      },
      {
        type: 'add',
        template: '// INPUT',
        path: `${codemodRoot}/codemods/{{codemodName}}/__testfixtures__/{{codemodName}}.input.ts`,
      },
      {
        type: 'add',
        template: '// OUTPUT',
        path: `${codemodRoot}/codemods/{{codemodName}}/__testfixtures__/{{codemodName}}.output.ts`,
      },
      {
        type: 'modify',
        path: `${codemodRoot}/utils/constants.ts`,
        pattern: /(\/\* \[add-sku-codemod-generator: codemod] \*\/)/g,
        template: `{
    description: '{{description}}',
    value: '{{codemodName}}',
  },\n  $1`,
      },
    ],
  });
};
