export type Template = 'webpack' | 'vite' | 'ssr';

export const isViteBasedTemplate = (template: Template): boolean =>
  template === 'vite' || template === 'ssr';
