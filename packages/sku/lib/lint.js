import {
  js as jsExtensions,
  ts as tsExtensions,
} from 'eslint-config-seek/extensions.js';

export const lintExtensions = [...tsExtensions, ...jsExtensions];
