export interface PolyfillRegistryEntry {
  reason: string;
  docsUrl?: string;
}

export type PolyfillRegistry = Record<string, PolyfillRegistryEntry>;

/**
 * Registry of polyfills that are unnecessary for sku's supported browsers
 */
export const POLYFILL_REGISTRY: PolyfillRegistry = {
  'core-js': {
    reason:
      'Most ES2015-ES2017 features are natively supported in modern browsers',
    docsUrl: 'https://github.com/zloirock/core-js#usage',
  },
  '@babel/polyfill': {
    reason: 'Deprecated package, replaced by core-js',
    docsUrl: 'https://babeljs.io/docs/en/babel-polyfill',
  },
  'regenerator-runtime': {
    reason: 'async/await is natively supported in modern browsers',
  },
  'es6-promise': {
    reason: 'Promises are natively supported in modern browsers',
  },
  'es6-promise/auto': {
    reason: 'Promises are natively supported in modern browsers',
  },
  'promise-polyfill': {
    reason: 'Promises are natively supported in modern browsers',
  },
  'whatwg-fetch': {
    reason: 'Fetch API is natively supported in modern browsers',
  },
  'isomorphic-fetch': {
    reason: 'Fetch API is natively supported in modern browsers',
  },
  'intersection-observer': {
    reason: 'IntersectionObserver is natively supported in modern browsers',
  },
} as const;
