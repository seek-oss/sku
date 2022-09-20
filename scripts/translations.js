const envCi = require('env-ci');

const { branch } = envCi();
const chalk = require('chalk');
const args = require('../config/args').argv;
const { compile, validate } = require('@vocab/core');
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

const ensureBranch = () => {
  if (!branch) {
    throw new Error(
      'Unable to determine branch from environment variables. Branch is required for this command.',
    );
  }
  console.log(`Using branch ${branch} for Phrase translations`);
};

(async () => {
  const translationSubCommand = commandArguments[0];

  console.log(chalk.cyan('Translations', translationSubCommand));

  const vocabConfig = getVocabConfig();

  if (!vocabConfig) {
    console.log(
      'No languages configured. Please set languages in sku.config.js before running translation commands',
    );
  }

  if (!translationSubCommands.includes(translationSubCommand)) {
    throw new Error(
      `Unknown command ${translationSubCommand}. Available options are ${translationSubCommands.join(
        ', ',
      )}`,
    );
  }

  try {
    if (translationSubCommand === 'compile') {
      compile({ watch: false }, vocabConfig);
    }
    if (translationSubCommand === 'validate') {
      validate(vocabConfig);
    }
    if (translationSubCommand === 'push') {
      const deleteUnusedKeys = commandArguments.includes(
        '--delete-unused-keys',
      );

      ensureBranch();
      push({ branch, deleteUnusedKeys }, vocabConfig);
    }
    if (translationSubCommand === 'pull') {
      ensureBranch();
      pull({ branch }, vocabConfig);
    }
  } catch (e) {
    if (e) {
      console.error(`Error running Translations ${translationSubCommand}:`, e);
    }

    process.exit(1);
  }
  console.log(chalk.cyan('Translations complete'));
})();
