import { runVocabCompile } from '../../../services/vocab/runVocab.js';
import { configureProject } from '../../../utils/configure.js';
import { assertPathAliasImports } from '../../../utils/pathAliasImports.js';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { vitestHandler } from './vitest-test-handler.js';

export const testAction = async (
  {
    skuContext,
  }: {
    skuContext: SkuContext;
  },
  { args = [] }: { args: string[] },
) => {
  await configureProject(skuContext);
  await assertPathAliasImports(skuContext.pathAliases);
  await runVocabCompile(skuContext);

  await vitestHandler({ skuContext, args });
};
