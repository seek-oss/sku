const path = require('path');
const fs = require('fs-extra');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');

const appDirectory = path.join(__dirname, 'app');
const srcDirectory = path.join(appDirectory, 'src');
const skuConfig = path.join(appDirectory, 'sku.config.js');
const testFile = path.join(srcDirectory, 'index.js');

function makeTest(input, expected) {
  return [input.join('\n'), expected.join('\n')];
}

const tests = [
  makeTest(
    [
      `import './reset';`,
      ``,
      `import LocalComponent from './LocalComponent';`,
      `import Parent from '../parent';`,
      `import someModule from 'some-module';`,
      `import distantParent from '../../../parent';`,
      `import path from 'path';`,
      `import styles from './styles.less';`,
      `import utils from 'src/utils';`,
    ],
    [
      `import './reset';`, // ensure side-effect imports are ignored
      ``,
      `import path from 'path';`, //  built-in
      ``,
      `import someModule from 'some-module';`, // external
      ``,
      `import utils from 'src/utils';`, // internal
      ``,
      `import distantParent from '../../../parent';`, // parents
      `import Parent from '../parent';`,
      ``,
      `import LocalComponent from './LocalComponent';`, // sibling
      ``,
      `import styles from './styles.less';`, // styles
    ],
  ),
  makeTest(
    [
      `import aTreat from './a.treat';`,
      `import bTreat from './b.treat';`,
      `import cTreat from '../c.treat';`,
      ``,
      `import b from './b';`,
      `import a from './a';`,
      `import c from '../c';`,
    ],
    [
      `import c from '../c';`,
      ``,
      `import a from './a';`,
      `import b from './b';`,
      ``,
      `import cTreat from '../c.treat';`,
      `import aTreat from './a.treat';`,
      `import bTreat from './b.treat';`,
    ],
  ),
];

describe('lint import order', () => {
  beforeAll(async () => {
    await fs.ensureDir(srcDirectory);
    await fs.writeFile(
      skuConfig,
      `module.exports = {
      srcPaths: ['src'],
      orderImports: true,
    };
    `,
    );
  });

  test.each(tests)('expect imports are ordered', async (input, expected) => {
    await fs.writeFile(testFile, input);

    await runSkuScriptInDir('format', appDirectory);

    const result = await (
      await fs.readFile(testFile, { encoding: 'utf-8' })
    ).trim();

    expect(result).toBe(expected);
  });

  afterAll(async () => {
    await fs.remove(appDirectory);
  });
});
