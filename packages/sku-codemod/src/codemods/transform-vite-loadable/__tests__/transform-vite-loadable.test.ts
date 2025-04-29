import { defineTest } from '../../../utils/test-utils.js';

defineTest(__dirname, 'transform-vite-loadable', {}, 'loadableNameFixture', {
  parser: 'tsx',
});
defineTest(__dirname, 'transform-vite-loadable', {}, 'customNameFixture', {
  parser: 'tsx',
});
