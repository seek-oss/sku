import React from 'react';
import { useTranslations } from '@vocab/react';

import translations from './App.vocab';

export default () => {
  const { t } = useTranslations(translations);

  return <div>{t('hello')}</div>;
};
