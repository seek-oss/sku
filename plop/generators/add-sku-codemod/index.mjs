const programRoot = './packages/sku-codemod/src/';

const addSkuCodemodGenerator = (plop) => {
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
        templateFile:
          './plop/generators/add-sku-codemod/templates/transform.hbs',
        path: `${programRoot}/codemods/{{codemodName}}/{{codemodName}}.ts`,
      },
      {
        type: 'add',
        templateFile: './plop/generators/add-sku-codemod/templates/test.hbs',
        path: `${programRoot}/codemods/{{codemodName}}/__tests__/{{codemodName}}.test.ts`,
      },
      {
        type: 'add',
        template: '// INPUT',
        path: `${programRoot}/codemods/{{codemodName}}/__testfixtutes__/{{codemodName}}.input.ts`,
      },
      {
        type: 'add',
        template: '// OUTPUT',
        path: `${programRoot}/codemods/{{codemodName}}/__testfixtutes__/{{codemodName}}.output.ts`,
      },
      {
        type: 'modify',
        path: `${programRoot}/utils/constants.ts`,
        pattern: /(\/\* \[add-sku-codemod-generator: codemod] \*\/)/g,
        template: `{
    title: '{{description}}',
    value: '{{codemodName}}',
    version: '0.0.1',
  },\n  $1`,
      },
    ],
  });
};

export default addSkuCodemodGenerator;
