const envCi = require('env-ci');

const { branch } = envCi();
const chalk = require('chalk');
const {
  argv: args,
  watch,
  'delete-unused-keys': deleteUnusedKeys,
} = require('../config/args');
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

const log = (message) => console.log(chalk.cyan(message));

(async () => {
  const translationSubCommand = commandArguments[0];

  const vocabConfig = getVocabConfig();

  if (!vocabConfig) {
    console.log(
      'No languages configured. Please set languages in  before running translation commands',
    );
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
        // Don't await so it can run in the background
        compile({ watch }, vocabConfig);
      } else {
        await compile({}, vocabConfig);
        log('Successfully compiled translations');
      }
    }

    if (translationSubCommand === 'validate') {
      log('Validating translations...');
      await validate(vocabConfig);
      log('Successfully validated translations');
    }

    if (translationSubCommand === 'push') {
      ensureBranch();

      log('Pushing translations to Phrase...');
      await push({ branch, deleteUnusedKeys }, vocabConfig);
      log('Successfully pushed translations to Phrase');
    }

    if (translationSubCommand === 'pull') {
      ensureBranch();

      log('Pulling translations from Phrase...');
      await pull({ branch }, vocabConfig);
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
