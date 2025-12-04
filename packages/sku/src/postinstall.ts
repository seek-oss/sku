import debug from 'debug';
import { setCwd, banner } from '@sku-lib/utils';
import { createSkuContext } from './context/createSkuContext.js';
import { styleText } from 'node:util';
import configureApp from './utils/configureApp.js';

/**
 * Separated out from the scripts/postinstall.js so that this can be bundled
 */

const log = debug('sku:postinstall');
const bold = (text: string) => styleText(['bold'], text);

export const postinstall = async ({
  localCwd,
  packageJson,
  hasSkuDep,
}: {
  localCwd: string;
  packageJson: string;
  hasSkuDep: boolean;
}) => {
  setCwd(localCwd);

  if (hasSkuDep) {
    banner('warning', 'sku dependency detected', [
      `${bold('sku')} is installed as a ${bold('dependency')} in ${bold(
        packageJson,
      )}.`,
      `${bold('sku')} should be installed in ${bold('devDependencies')}.`,
    ]);
  }

  try {
    log('postinstall', 'running configure');
    const skuContext = createSkuContext({});
    configureApp(skuContext);
  } catch (error) {
    console.error(
      'An error occurred running postinstall script. Please check that sku.config.js is correct and try again.',
    );
    console.error(error);
    process.exit(1);
  }
  log('postinstall', 'successfully configured');
};
