import { compile } from '@vocab/core';
import { getVocabConfig } from '../config/vocab/vocab.js';

export const runVocabCompile = async () => {
  const vocabConfig = getVocabConfig();
  if (vocabConfig) {
    console.log('Running Vocab compile');
    await compile({ watch: false }, vocabConfig);
  }
};

export const watchVocabCompile = async () => {
  const vocabConfig = getVocabConfig();
  if (vocabConfig) {
    console.log('Starting Vocab compile in watch mode');
    await compile({ watch: true }, vocabConfig);
  }
};
