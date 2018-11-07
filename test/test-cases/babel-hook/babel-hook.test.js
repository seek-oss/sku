const fs = require('fs');
const path = require('path');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');

const appDir = __dirname;
const distDir = path.resolve(appDir, 'dist');

describe('BabelHook', () => {
  beforeAll(async () => {
    await runSkuScriptInDir('build', appDir);
  });

  it('should generate the expected files', async () => {
    const bundle = fs.readFileSync(`${distDir}/main.js`).toString();
    expect(bundle).toContain('BabelHook success!');

    const html = fs.readFileSync(`${distDir}/index.html`).toString();
    expect(html).toContain('BabelHook success!');
  });
});
