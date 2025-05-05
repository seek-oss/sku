export type Codemod = {
  description: string;
  value: string;
};

export const CODEMODS: Codemod[] = [
  {
    description:
      'Transform all webpack loadable imports to Vite loadable imports',
    value: 'transform-vite-loadable',
  },
  /* [add-sku-codemod-generator: codemod] */
];
