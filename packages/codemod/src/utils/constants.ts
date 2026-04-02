type Codemod = {
  description: string;
  value: string;
};

export const CODEMODS = [
  {
    description:
      'Transform all webpack loadable imports to Vite loadable imports',
    value: 'transform-vite-loadable',
  },
  {
    description: 'Convert Jest tests to Vitest',
    value: 'jest-to-vitest',
  },
  {
    description: 'Add query params to SVG imports for compatibility with Vite',
    value: 'svg-import-query-params',
  },
  /* [add-sku-codemod-generator: codemod] */
] as const satisfies Codemod[];

export type CodemodName = (typeof CODEMODS)[number]['value'];
