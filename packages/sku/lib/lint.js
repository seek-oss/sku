import {
  js as jsExtensions,
  ts as tsExtensions,
} from 'eslint-config-seek/extensions';

export const lintExtensions = [...tsExtensions, ...jsExtensions];
