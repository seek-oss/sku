import prompts from 'prompts';
import installDep from '@/services/packageManager/install.js';
import type { SkuContext } from '@/context/createSkuContext.js';

export const vitestHandler = async ({
  skuContext,
  args,
}: {
  skuContext: SkuContext;
  args: string[];
}) => {
  try {
    const { runVitest } = await import('@sku-lib/vitest');
    await runVitest({
      setupFiles: skuContext.paths.setupTests,
      filters: args,
    });
    return;
  } catch (e: any) {
    // If Vitest is not installed, we fall back to Jest
    if (e.code === 'ERR_MODULE_NOT_FOUND') {
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
    }
  }
};
