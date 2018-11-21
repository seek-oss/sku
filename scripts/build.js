// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

const {
  copyPublicFiles,
  cleanTargetFolder,
  ensureTargetDirectory,
  cleanRenderJs
} = require('../lib/buildFileUtils');

const { run } = require('../lib/runWebpack');
const webpackCompiler = require('../config/webpack/webpack.compiler');

(async () => {
  try {
    await ensureTargetDirectory();
    await cleanTargetFolder();
    await run(webpackCompiler);
    await cleanRenderJs();
    await copyPublicFiles();
    console.log('Sku build complete!');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
