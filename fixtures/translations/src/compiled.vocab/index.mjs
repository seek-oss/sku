import { createTranslationFile, createLanguage } from '@vocab/core/runtime';
const translations = createTranslationFile({
  en: createLanguage({
    'Company name': 'Company name',
  }),
  fr: createLanguage({
    'Company name': 'บริษัท',
  }),
  'en-PSEUDO': createLanguage({
    'Company name': '[Çööm̂ƥăăกี้ýý กี้ăăm̂ẽẽ]',
  }),
});
export { translations as default };
