const path = require('path');
const fs = require('fs-extra');
const dedent = require('dedent');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');

const appDirectory = path.dirname(
  require.resolve('@fixtures/import-order/sku.config.js'),
);
const srcDirectory = path.join(appDirectory, 'src');
const testFile = (fileName) => path.join(srcDirectory, fileName);

expect.addSnapshotSerializer({
  serialize: (val) => val,
  test: (val) => typeof val === 'string',
});

const files = {
  'index.ts': dedent/* ts */ `
    import './reset'; // side-effect imports should stay put

    import LocalComponent from './LocalComponent'; // sibling
    import Parent from '../parent'; // parents
    import someModule from 'some-module'; // external
    import vanillaStyles from './vanillaStyles.css'; // styles
    import distantParent from '../../../parent'; // parents
    import myself from '.'; // index
    import path from 'path'; //  built-in
    import styles from './styles.less'; // styles
    import utils from 'src/utils'; // internal
  `,
  'relatives.js': dedent/* js */ `
    import aTreat from './a.treat';
    import bTreat from './b.treat';
    import cTreat from '../c.treat';

    import b from './b';
    import a from './a';
    import c from '../c';
  `,
  'vanilla.ts': dedent/* ts */ `
    import aStyle from './a.css';
    import bStyle from './b.css';
    import cStyle from '../c.css';

    import b from './b';
    import a from './a';
    import c from '../c';
  `,
};

describe('import order', () => {
  beforeAll(async () => {
    await fs.ensureDir(srcDirectory);
  });

  afterAll(async () => {
    await fs.remove(srcDirectory);
  });

  test.each(Object.keys(files))('imports are ordered: %s', async (fileName) => {
    const filePath = testFile(fileName);
    await fs.writeFile(filePath, files[fileName]);

    await runSkuScriptInDir('format', appDirectory);

    const result = await fs.readFile(filePath, { encoding: 'utf-8' });

    expect(result).toMatchSnapshot();
  });
});
