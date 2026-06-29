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
  'babel-polyfill': {
    reason: 'Deprecated package',
    docsUrl: 'https://babeljs.io/docs/en/babel-polyfill',
  },
  'regenerator-runtime': {
    reason:
      'async/await is well established and works across many devices and browser versions. It has been available across browsers since April 2017.',
  },
  'es6-promise': {
    reason:
      'Promise is well established and works across many devices and browser versions. It has been available across browsers since July 2015.',
  },
  'es6-promise/auto': {
    reason:
      'Promise is well established and works across many devices and browser versions. It has been available across browsers since July 2015.',
  },
  'promise-polyfill': {
    reason:
      'Promise is well established and works across many devices and browser versions. It has been available across browsers since July 2015.',
  },
  'whatwg-fetch': {
    reason:
      'fetch is well established and works across many devices and browser versions. It has been available across browsers since March 2017 and Node.js since v18.0.0.',
  },
  'isomorphic-fetch': {
    reason:
      'fetch is well established and works across many devices and browser versions. It has been available across browsers since March 2017 and Node.js since v18.0.0.',
  },
  'node-fetch': {
    reason:
      'fetch is well established and works across many devices and browser versions. It has been available across browsers since March 2017 and Node.js since v18.0.0.',
  },
  'cross-fetch': {
    reason:
      'fetch is well established and works across many devices and browser versions. It has been available across browsers since March 2017 and Node.js since v18.0.0.',
  },
  'intersection-observer': {
    reason:
      'IntersectionObserver is well established and works across many devices and browser versions. It has been available across browsers since March 2019.',
  },
  raf: {
    reason:
      'requestAnimationFrame is well established and works across many devices and browser versions. It has been available across browsers since July 2015.',
  },
  'raf/polyfill': {
    reason:
      'requestAnimationFrame is well established and works across many devices and browser versions. It has been available across browsers since July 2015.',
  },
  'url-search-params-polyfill': {
    reason:
      'URLSearchParams is well established and works across many devices and browser versions. It has been available across browsers since April 2018.',
  },
} as const;
