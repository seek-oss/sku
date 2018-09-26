const fs = require('fs');
const path = require('path');
const { promisify } = require('es6-promisify');
const rimrafAsync = promisify(require('rimraf'));
const dirContentsToObject = require('../../utils/dirContentsToObject');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const appDir = path.resolve(__dirname, 'app');
const distDir = path.resolve(appDir, 'dist');

describe('babel-decorator', () => {
  beforeAll(async () => {
    await rimrafAsync(distDir);
    await runSkuScriptInDir('build', appDir);
  });

  it('should generate the expected files', async () => {
    const bundle = fs.readFileSync(`${distDir}/main.js`).toString();
    expect(bundle).toContain('Babel decorator success!');

    const html = fs.readFileSync(`${distDir}/index.html`).toString();
    expect(html).toContain('Babel decorator success!');
  });
});
