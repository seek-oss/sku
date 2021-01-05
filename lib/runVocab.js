const { compile } = require('@vocab/core');

const runVocabCompile = async () => {
  const vocabConfig = getVocabConfig();
  if (vocabConfig) {
    console.log('Running Vocab compile');
    await compile({ watch: false }, vocabConfig);
  }
};

const watchVocabCompile = async () => {
  const vocabConfig = getVocabConfig();
  if (vocabConfig) {
    console.log('Starting Vocab compile in watch mode');
    await compile({ watch: true }, vocabConfig);
  }
};

module.exports = {
  runVocabCompile,
  watchVocabCompile,
};
