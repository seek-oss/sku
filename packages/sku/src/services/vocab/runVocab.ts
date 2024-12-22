import { compile } from '@vocab/core';
import { getVocabConfig } from './config/vocab.js';
import { SkuContext } from '@/context/createSkuContext.js';

export const runVocabCompile = async (skuContext: SkuContext) => {
  const vocabConfig = getVocabConfig(skuContext);
  if (vocabConfig) {
    console.log('Running Vocab compile');
    await compile({ watch: false }, vocabConfig);
  }
};

export const watchVocabCompile = async (skuContext: SkuContext) => {
  const vocabConfig = getVocabConfig(skuContext);
  if (vocabConfig) {
    console.log('Starting Vocab compile in watch mode');
    await compile({ watch: true }, vocabConfig);
  }
};
