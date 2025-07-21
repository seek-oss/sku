export const bundlers = ['vite', 'webpack'] as const;

export type BundlerValues<T> = Record<(typeof bundlers)[number], T>;

export const testFramework = ['vitest', 'jest'] as const;

export type TestFrameworkValues<T> = Record<(typeof testFramework)[number], T>;
