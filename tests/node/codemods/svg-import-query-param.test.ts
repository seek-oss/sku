import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('svg-import-query-param', 'svg-import-query-param', [
  {
    filename: 'svg-imports.tsx',
    input: ts /* ts */ `
      import foo from './foo.svg';
      import foo from './foo.svg?inline';
      import foo from './foo.ts';
      import foo from './.svg/foo.ts';
    `,
    output: ts /* ts */ `
      import foo from './foo.svg?raw';
      import foo from './foo.svg?inline';
      import foo from './foo.ts';
      import foo from './.svg/foo.ts';
    `,
  },
]);
