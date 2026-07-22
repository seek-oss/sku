export type Template = 'webpack' | 'vite' | 'vite-ssr';

export const isViteBasedTemplate = (template: Template): boolean =>
  template === 'vite' || template === 'vite-ssr';
