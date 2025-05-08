import { runVocabCompile } from '@/services/vocab/runVocab.js';
import { configureProject } from '@/utils/configure.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { runVitest } from './vitest-test-handler.js';
import { runJestTests } from './jest-test-handler.js';

const testAction = async (
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
    await runVitest({ skuContext, filters: args });
    return;
  }
  runJestTests({ skuContext }, { args });
};

export { testAction };
