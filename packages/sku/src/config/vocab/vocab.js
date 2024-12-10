import { languages } from '../../context/index.js';
import debug from 'debug';
import { generator } from '@vocab/pseudo-localize';

const log = debug('sku:vocab:config');

export const getVocabConfig = () => {
  if (!languages) {
    log('No languagages set. Skipping vocab');
    return null;
  }

  const result = {
    devLanguage: 'en',
    ignore: ['node_modules/sku/**', 'node_modules/vocab/**'],
    languages,
    generatedLanguages: [
      {
        name: 'en-PSEUDO',
        generator,
      },
    ],
  };
  log('Using Vocab options:', result);

  return result;
};
