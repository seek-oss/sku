import { createDebug } from 'obug';
import { setCwd } from '@sku-private/utils';
import { createSkuContext } from './context/createSkuContext.js';
import configureApp from './utils/configureApp.js';
import { banner, strong } from '@sku-private/utils/console';

/**
 * Separated out from the scripts/postinstall.js so that this can be bundled
 */

const log = createDebug('sku:postinstall');

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
    banner('caution', 'sku dependency detected', [
      `${strong('sku')} is installed as a ${strong('dependency')} in ${strong(
        packageJson,
      )}.`,
      `${strong('sku')} should be installed in ${strong('devDependencies')}.`,
    ]);
  }

  try {
    log('postinstall', 'running configure');
    const skuContext = await createSkuContext({});
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
