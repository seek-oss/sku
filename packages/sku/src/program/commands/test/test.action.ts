import { runVocabCompile } from '@/services/vocab/runVocab.js';
import { configureProject } from '@/utils/configure.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { runJestTests } from './jest-test-handler.js';
import prompts from 'prompts';
import installDep from '@/services/packageManager/install.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const testAction = async (
  {
    skuContext,
  }: {
    skuContext: SkuContext;
  },
  { args = [] }: { args: string[] },
) => {
  await configureProject(skuContext);
  await runVocabCompile(skuContext);

  if (skuContext.testRunner === 'vitest') {
    try {
      // @ts-ignore
      // eslint-disable-next-line import-x/no-unresolved
      const { runVitest } = await import('@sku-lib/vitest');

      console.log('requireREsolve', require.resolve('@sku-lib/vitest'));

      console.log('Running Vitest tests...', runVitest);
      await runVitest({
        setupFiles: skuContext.paths.setupTests,
        filters: args,
      });
      return;
    } catch (e: any) {
      // If Vitest is not installed, we fall back to Jest
      console.log('error', e);
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
        await testAction({ skuContext }, { args });
      }
    }
  }
  runJestTests({ skuContext }, { args });
};
