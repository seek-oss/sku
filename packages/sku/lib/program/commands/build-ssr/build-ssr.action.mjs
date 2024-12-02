import { performance } from 'node:perf_hooks';
import prettyMilliseconds from 'pretty-ms';
import { webpack } from 'webpack';
import { green, red } from 'chalk';
import { run } from '../../../runWebpack';
import {
  copyPublicFiles,
  cleanTargetDirectory,
  ensureTargetDirectory,
} from '../../../buildFileUtils';
import makeWebpackConfig from '../../../../config/webpack/webpack.config.ssr';
import { port, cspEnabled } from '../../../../context';
import track from '../../../../telemetry';

import { runVocabCompile } from '../../../runVocab';
import { configureProject, validatePeerDeps } from '../../../utils/configure';

// First, ensure the build is running in production mode
process.env.NODE_ENV = 'production';

export const buildSsrAction = async ({ stats }) => {
  await configureProject();
  validatePeerDeps();
  try {
    await runVocabCompile();
    const [clientConfig, serverConfig] = makeWebpackConfig({
      clientPort: port.client,
      serverPort: port.server,
      stats,
    });
    await ensureTargetDirectory();
    await cleanTargetDirectory();
    await run(webpack(clientConfig), { stats });
    await run(webpack(serverConfig), { stats });
    await copyPublicFiles();

    const timeTaken = performance.now();
    track.timing('build', timeTaken, {
      status: 'success',
      type: 'ssr',
      csp: cspEnabled,
    });

    console.log(
      green(`Sku build complete in ${prettyMilliseconds(timeTaken)}`),
    );
  } catch (error) {
    const timeTaken = performance.now();
    track.timing('build', timeTaken, {
      status: 'failed',
      type: 'ssr',
      csp: cspEnabled,
    });

    console.error(red(error));

    process.exitCode = 1;
  } finally {
    await track.close();

    if (process.env.SKU_FORCE_EXIT) {
      process.exit();
    }
  }
};
