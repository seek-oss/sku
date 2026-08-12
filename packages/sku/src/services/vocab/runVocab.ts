import { compile } from '@vocab/core';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { getVocabConfig } from './config.js';
import type { SkuContext } from '../../context/createSkuContext.js';

/**
 * Vocab's `compile` always ignores node_modules, so shared packages with
 * `.vocab` (via `compilePackages`) need a separate compile with their package root.
 */
const compileConfiguredCompilePackages = async (
  skuContext: SkuContext,
  vocabConfig: NonNullable<ReturnType<typeof getVocabConfig>>,
  { watch }: { watch: boolean },
) => {
  const requireFromCwd = createRequire(join(process.cwd(), 'package.json'));

  for (const packageName of skuContext.configuredCompilePackages) {
    let projectRoot: string;
    try {
      projectRoot = dirname(
        requireFromCwd.resolve(`${packageName}/package.json`),
      );
    } catch {
      continue;
    }

    await compile({ watch }, { ...vocabConfig, projectRoot });
  }
};

export const runVocabCompile = async (skuContext: SkuContext) => {
  const vocabConfig = getVocabConfig(skuContext);
  if (vocabConfig) {
    console.log('Running Vocab compile');
    await compile({ watch: false }, vocabConfig);
    await compileConfiguredCompilePackages(skuContext, vocabConfig, {
      watch: false,
    });
  }
};

export const watchVocabCompile = async (skuContext: SkuContext) => {
  const vocabConfig = getVocabConfig(skuContext);
  if (vocabConfig) {
    console.log('Starting Vocab compile in watch mode');
    await compile({ watch: true }, vocabConfig);
    // Initial compile only for shared packages (app watch covers the consumer tree).
    await compileConfiguredCompilePackages(skuContext, vocabConfig, {
      watch: false,
    });
  }
};
