import { defineTest } from '../../../utils/test-utils.js';

defineTest(__dirname, 'transform-vite-loadable', 'loadableNameFixture', {
  extension: 'tsx',
});

defineTest(__dirname, 'transform-vite-loadable', 'customNameFixture', {
  extension: 'tsx',
});
