const { promisify } = require('es6-promisify');
const rimrafAsync = promisify(require('rimraf'));
const dirContentsToObject = require('../../utils/dirContentsToObject');
const { exec } = require('child-process-promise');

describe('react-css-modules', () => {
  beforeAll(async () => {
    await rimrafAsync(`${__dirname}/dist`);
    await exec(`node ${__dirname}/../../../scripts/build`, { cwd: __dirname });
  });

  it('should generate the expected files', async () => {
    const files = await dirContentsToObject(`${__dirname}/dist`);
    expect(files).toMatchSnapshot();
  });
});
