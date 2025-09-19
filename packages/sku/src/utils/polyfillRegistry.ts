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
      'Polyfills many features that may be unnecessary. Consider removing or using targeted polyfills for specific APIs.',
    docsUrl: 'https://github.com/zloirock/core-js#usage',
  },
  '@babel/polyfill': {
    reason: 'Deprecated package',
    docsUrl: 'https://babeljs.io/docs/en/babel-polyfill',
  },
  'babel/polyfill': {
    reason: 'Deprecated package',
    docsUrl: 'https://babeljs.io/docs/en/babel-polyfill',
  },
  'regenerator-runtime': {
    reason:
      'async/await is well established and works across many devices and browser versions. It has been available across browsers since April 2017.',
  },
  'es6-promise': {
    reason:
      'Promises is well established and works across many devices and browser versions. It has been available across browsers since July 2015.',
  },
  'es6-promise/auto': {
    reason:
      'Promises is well established and works across many devices and browser versions. It has been available across browsers since July 2015.',
  },
  'promise-polyfill': {
    reason:
      'Promises is well established and works across many devices and browser versions. It has been available across browsers since July 2015.',
  },
  'whatwg-fetch': {
    reason:
      'Fetch API is well established and works across many devices and browser versions. It has been available across browsers since March 2017.',
  },
  'isomorphic-fetch': {
    reason:
      'Fetch API is well established and works across many devices and browser versions. It has been available across browsers since March 2017, and Node.js since April 2022.',
  },
  'intersection-observer': {
    reason:
      'IntersectionObserver is well established and works across many devices and browser versions. It has been available across browsers since March 2019.',
  },
} as const;
