export const bundlers = ['vite', 'webpack'] as const;

export type BundlerValues<T> = Record<(typeof bundlers)[number], T>;

export const testFrameworks = ['vitest', 'jest'] as const;

export type TestFrameworkValues<T> = Record<(typeof testFrameworks)[number], T>;
