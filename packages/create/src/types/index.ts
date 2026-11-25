export const templates = ['vite', 'ssr'] as const;

export type Template = (typeof templates)[number];
