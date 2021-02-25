const rmfr = require('rmfr');
const fs = require('fs');
const path = require('path');
const spawnSkuScriptInDir = require('../../utils/spawnSkuScriptInDir');
const { promptForBraidTheme } = require('../../../lib/prompts');

describe('sku init', () => {
  it('should create a sku.config.js', async () => {
    // `sku init` is a long running task and can take some time to complete
    jest.setTimeout(150 * 1000);
    const projectName = 'new-project';
    await rmfr(path.join(__dirname, projectName));

    const childPromise = spawnSkuScriptInDir('init', __dirname, [projectName], {
      pipeToParentIo: false,
    });
    const childProcess = childPromise.childProcess;

    childProcess.stdout.on('data', async (data) => {
      if (data.toString().includes(promptForBraidTheme)) {
        // Select first theme
        childProcess.stdin.write(' ');

        // Wait for selection to be handled
        await new Promise((r) => setTimeout(r, 200));

        // Accept selection
        childProcess.stdin.write('\n');
      }
    });

    // Should exit with exit code 0
    await expect(childPromise).resolves.toEqual(
      expect.objectContaining({ code: 0 }),
    );

    const skuConfig = require(path.join(
      __dirname,
      projectName,
      'sku.config.js',
    ));

    expect(skuConfig).toMatchInlineSnapshot(`
      Object {
        "clientEntry": "src/client.tsx",
        "orderImports": true,
        "publicPath": "/path/to/public/assets/",
        "renderEntry": "src/render.tsx",
        "sites": Array [
          Object {
            "host": "dev.apac.com",
            "name": "apac",
          },
        ],
      }
    `);
  });
});
