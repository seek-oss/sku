import React from 'react';
import { useTranslation } from '@vocab/react';

import translations from './translations';

export default () => {
  const { t } = useTranslation(translations);

  return <div>{t('hello')}</div>;
};
