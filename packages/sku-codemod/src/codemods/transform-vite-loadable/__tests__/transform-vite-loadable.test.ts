import { defineTest } from '../../../utils/test-utils.js';

defineTest(__dirname, 'transform-vite-loadable', 'loadableNameFixture', {
  extension: 'tsx',
});

defineTest(__dirname, 'transform-vite-loadable', 'customNameFixture', {
  extension: 'tsx',
});

defineTest(__dirname, 'transform-vite-loadable', 'mixedImportFixture', {
  extension: 'tsx',
});

// This test should ensure that the codemod does not change the file

defineTest(__dirname, 'transform-vite-loadable', 'onlyNamedImportFixture', {
  extension: 'tsx',
  shouldNotChange: true,
});
