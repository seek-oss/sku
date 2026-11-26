export const bundlers = ['vite', 'webpack'] as const;

export type BundlerValues<T> = Record<(typeof bundlers)[number], T>;
