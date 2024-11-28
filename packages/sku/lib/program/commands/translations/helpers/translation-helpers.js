const { getVocabConfig } = require('../../../../../config/vocab/vocab');
const { resolveConfig } = require('@vocab/core');

const ensureBranch = async () => {
  const { default: envCi } = await import('env-ci');
  const { branch } = envCi();

  if (!branch) {
    throw new Error(
      'Unable to determine branch from environment variables. Branch is required for this command.',
    );
  }

  console.log(`Using branch ${branch} for Phrase translations`);

  return branch;
};

const getResolvedVocabConfig = async ({ translationSubCommand }) => {
  const vocabConfigFromSkuConfig = getVocabConfig();
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

module.exports = {
  getResolvedVocabConfig,
  ensureBranch,
};
