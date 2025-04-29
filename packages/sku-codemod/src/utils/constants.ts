export type Codemod = {
  title: string;
  value: string;
  version: string;
};

export const CODEMODS: Codemod[] = [
  {
    title: 'Transform all webpack loadable imports to Vite loadable imports',
    value: 'transform-vite-loadable',
    version: '0.0.1',
  },
];
