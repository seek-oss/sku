import React from 'react';
import { useTranslations } from '@vocab/react';

import translations from './translations';

export default () => {
  const { t } = useTranslations(translations);

  return <div>{t('hello')}</div>;
};
