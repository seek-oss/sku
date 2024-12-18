const chalk = require('chalk');
const {
  argv: args,
  watch,
  'delete-unused-keys': deleteUnusedKeys,
} = require('../config/args');
const { compile, validate, resolveConfig } = require('@vocab/core');
const { push, pull } = require('@vocab/phrase');
const { getVocabConfig } = require('../config/vocab/vocab');

const translationSubCommands = ['compile', 'push', 'pull', 'validate'];

const commandArguments = args.length > 0 ? args : undefined;

if (!commandArguments) {
  throw new Error(
    `No translations command provided. Available commands are: ${translationSubCommands.join(
      ', ',
    )}.`,
  );
}

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

const log = (message) => console.log(chalk.cyan(message));

(async () => {
  const translationSubCommand = commandArguments[0];

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

  if (!translationSubCommands.includes(translationSubCommand)) {
    throw new Error(
      `Unknown sub-command ${translationSubCommand}. Available options are ${translationSubCommands.join(
        ', ',
      )}.`,
    );
  }

  try {
    if (translationSubCommand === 'compile') {
      log('Compiling translations...');

      if (watch) {
        log('Watching for changes to translations');
      }

      await compile({ watch }, vocabConfigFromSkuConfig);

      if (!watch) {
        log('Successfully compiled translations');
      }
    }

    if (translationSubCommand === 'validate') {
      log('Validating translations...');
      await validate(vocabConfigFromSkuConfig);
      log('Successfully validated translations');
    }

    if (translationSubCommand === 'push') {
      const branch = await ensureBranch();

      log('Pushing translations to Phrase...');
      await push({ branch, deleteUnusedKeys }, vocabConfigFromSkuConfig);
      log('Successfully pushed translations to Phrase');
    }

    if (translationSubCommand === 'pull') {
      const branch = await ensureBranch();

      log('Pulling translations from Phrase...');
      await pull({ branch }, vocabConfigFromSkuConfig);
      log('Successfully pulled translations from Phrase');
    }
  } catch (e) {
    if (e) {
      console.error(
        `Error running ${chalk.bold(`translations ${translationSubCommand}`)}:`,
        e,
      );
    }

    process.exit(1);
  }
})();
