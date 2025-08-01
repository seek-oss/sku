import prompts from 'prompts';
import installDep from '../../../services/packageManager/install.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import isCI from '../../../utils/isCI.js';

export const vitestHandler = async ({
  skuContext,
  args,
}: {
  skuContext: SkuContext;
  args: string[];
}) => {
  let skuLibVitest = null;

  try {
    skuLibVitest = await import('@sku-lib/vitest');
  } catch (e: any) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND' || isCI) {
      console.error(e.message);
      return;
    }

    // If @sku-lib/vitest is not installed, and we're not on CI we prompt to install
    console.log('@sku-lib/vitest is not installed');
    const res = await prompts(
      {
        type: 'confirm',
        name: 'install',
        message: 'Do you want to install `@sku-lib/vitest`?',
        initial: true,
      },
      { onCancel: () => process.exit(1) },
    );

    if (!res.install) {
      console.log('Exiting without running tests.');
      return;
    }

    await installDep({
      deps: ['@sku-lib/vitest'],
      type: 'dev',
      logLevel: 'regular',
    });

    // Retry running Vitest after installation
    await vitestHandler({ skuContext, args });
    return;
  }

  await skuLibVitest.runVitest({
    setupFiles: skuContext.paths.setupTests,
    args,
  });
};
