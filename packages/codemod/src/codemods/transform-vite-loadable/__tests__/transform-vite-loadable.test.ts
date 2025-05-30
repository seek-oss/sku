import { describe, it } from 'vitest';

import { runTest, runNoChangeTest } from '../../../utils/test-utils.js';

const tests = [
  {
    fixtureName: 'customNameFixture',
  },
  {
    fixtureName: 'loadableNameFixture',
  },
  {
    fixtureName: 'mixedImportFixture',
  },
  {
    fixtureName: 'onlyNamedImportFixture',
    shouldNotChange: true,
  },
];

describe('[CODEMOD]: "transform-vite-loadable"', () => {
  it.for(tests)('"$fixtureName"', async ({ fixtureName, shouldNotChange }) => {
    const testRunner = shouldNotChange ? runNoChangeTest : runTest;
    testRunner({
      dirName: __dirname,
      transformName: 'transform-vite-loadable',
      fixtureName,
      testOptions: {
        extension: 'tsx',
      },
    });
  });
});
