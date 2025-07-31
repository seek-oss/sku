import { resolveConfig } from '@vocab/core';

import { getVocabConfig } from '../../../../services/vocab/config/vocab.js';
import type { SkuContext } from '../../../../context/createSkuContext.js';
import { execSync } from 'node:child_process';

export const ensureBranch = async () => {
  const branch = getGitBranch();

  if (!branch) {
    throw new Error(
      'Unable to determine branch from environment variables. Branch is required for this command.',
    );
  }

  console.log(`Using branch ${branch} for Phrase translations`);

  return branch;
};

export const getResolvedVocabConfig = async ({
  translationSubCommand,
  skuContext,
}: {
  translationSubCommand: 'push' | 'pull' | 'compile' | 'validate';
  skuContext: SkuContext;
}) => {
  const vocabConfigFromSkuConfig = getVocabConfig(skuContext);
  const resolvedVocabConfig = await resolveConfig();

  if (vocabConfigFromSkuConfig && resolvedVocabConfig) {
    console.log(
      `Ignoring vocab config file in ${resolvedVocabConfig.projectRoot}. Sku only supports multi-language applications by configuring the "languages" property in your sku config.`,
    );
  }

  if (!vocabConfigFromSkuConfig) {
    let errorMessage =
      'No "languages" configured. Please configure "languages" in your sku config before running translation commands.';

    if (resolvedVocabConfig) {
      errorMessage += `\nIt looks like you have a vocab config file in ${resolvedVocabConfig.projectRoot}. Perhaps you intended to run "vocab ${translationSubCommand}" instead?`;
    }

    throw new Error(errorMessage);
  }

  return vocabConfigFromSkuConfig;
};

// Modified from `env-ci` to use `execSync`
// https://github.com/semantic-release/env-ci/blob/e11b2965aa82cd7366511635d9bc4ae3d0144f64/lib/git.js#L11C24-L35
function getGitBranch() {
  try {
    const headRef = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
    }).trim();

    if (headRef === 'HEAD') {
      const branch = execSync('git show -s --pretty=%d HEAD', {
        encoding: 'utf8',
      })
        .trim()
        .replace(/^\(|\)$/g, '')
        .split(', ')
        .find((b) => b.startsWith('origin/'));

      return branch ? branch.match(/^origin\/(?<branch>.+)/)?.[1] : undefined;
    }

    return headRef;
  } catch {
    return undefined;
  }
}
