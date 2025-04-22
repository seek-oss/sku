import { useTranslations } from '@vocab/react';

import translations from './App.vocab';
import compiledTranslations from './compiled.vocab';

export default () => {
  const { t } = useTranslations(translations);
  const compiled = useTranslations(compiledTranslations);

  return (
    <div>
      {t('hello')}
      {compiled.t('Company name')}
    </div>
  );
};
