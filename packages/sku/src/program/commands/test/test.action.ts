import { runVocabCompile } from '@/services/vocab/runVocab.js';
import { configureProject } from '@/utils/configure.js';
import type { SkuContext } from '@/context/createSkuContext.js';
import { runJestTests } from './jest-test-handler.js';
import { vitestHandler } from '@/program/commands/test/vitest-test-handler.js';

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
    await vitestHandler({ skuContext, args });
    return;
  }

  runJestTests({ args });
};
