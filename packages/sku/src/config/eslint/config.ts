import eslintConfigSeek from 'eslint-config-seek';
import type { Linter } from 'eslint';

import { createImportOrderConfig } from './importOrder.js';
import { createEslintIgnoresConfig } from './ignores.js';
import { getSkuContext } from '../../context/createSkuContext.js';

export const createEslintConfig = ({
  configPath,
}: {
  configPath?: string;
} = {}): Linter.Config[] => {
  const skuContext = getSkuContext({ configPath });
  const { eslintDecorator, eslintIgnore, languages, paths } = skuContext;
  const { relativeTarget } = paths;

  const _eslintConfigSku: Linter.Config[] = [
    createEslintIgnoresConfig({
      hasLanguagesConfig: Boolean(languages && languages.length > 0),
      target: relativeTarget,
    }),
    ...eslintConfigSeek,
    createImportOrderConfig(skuContext),
    ...(eslintIgnore && eslintIgnore.length > 0
      ? // Spread here to turn a read-only array into a mutable one
        [{ ignores: [...eslintIgnore] }]
      : []),
  ];

  const eslintConfigSku: Linter.Config[] | undefined =
    eslintDecorator?.(_eslintConfigSku);

  return eslintConfigSku;
};
