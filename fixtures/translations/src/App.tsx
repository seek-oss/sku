import { useTranslations } from '@vocab/react';

import translations from './App.vocab';
// @ts-expect-error no types
import compiledTranslations from './compiled.vocab/index.mjs';

export default () => {
  const { t } = useTranslations(translations);
  const compiled = useTranslations(compiledTranslations);

  return (
    <div>
      {t('hello')} {compiled.t('Company name')}
    </div>
  );
};
