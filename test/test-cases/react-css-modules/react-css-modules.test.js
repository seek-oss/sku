const { promisify } = require('es6-promisify');
const rimrafAsync = promisify(require('rimraf'));
const dirContentsToObject = require('../../utils/dirContentsToObject');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');

describe('react-css-modules', () => {
  beforeAll(async () => {
    await rimrafAsync(`${__dirname}/dist`);
    await runSkuScriptInDir('build', __dirname);
  });

  it('should generate the expected files', async () => {
    const files = await dirContentsToObject(`${__dirname}/dist`);
    expect(files).toMatchSnapshot();
  });
});
