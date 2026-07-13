import { useTranslations } from '@vocab/react';

import translations from './hello.vocab';

export function Component() {
  const { t } = useTranslations(translations);

  return (
    <main>
      <h1 data-testid="hello">{t('greeting')}</h1>
    </main>
  );
}
