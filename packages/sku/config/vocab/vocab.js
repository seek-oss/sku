const { languages } = require('../../context');
const log = require('debug')('sku:vocab:config');
const { generator } = require('@vocab/pseudo-localize');

const generateRandomCJKCharacter = () =>
  String.fromCharCode(Math.round(Math.random() * 20901) + 19968);

const getVocabConfig = () => {
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
      {
        name: 'zh-HK-RANDOM',
        generator: {
          transformMessage: (message) => {
            const l = message.length;
            let newMessage = '';
            for (let i = 0; i < l; i++) {
              newMessage += generateRandomCJKCharacter();
            }

            return newMessage;
          },
        },
      },
    ],
  };
  log('Using Vocab options:', result);

  return result;
};

module.exports = { getVocabConfig };
