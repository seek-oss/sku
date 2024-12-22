// @ts-expect-error `eslint-config-seek` has no types yet
import eslintConfigSeek from 'eslint-config-seek';
import type { Linter } from 'eslint';

import { createImportOrderConfig } from './importOrder.js';
import { createEslintIgnoresConfig } from './ignores.js';
import { getSkuContext, SkuContext } from '@/context/createSkuContext.js';

export const createEslintConfig = (skuContext: SkuContext) => {
  const { eslintDecorator, eslintIgnore, languages, paths } = skuContext;
  const { relativeTarget } = paths;

  const _eslintConfigSku = [
    createEslintIgnoresConfig({
      hasLanguagesConfig: Boolean(languages && languages.length > 0),
      target: relativeTarget,
    }),
    ...eslintConfigSeek,
    createImportOrderConfig(skuContext),
    ...(eslintIgnore && eslintIgnore.length > 0
      ? [{ ignores: eslintIgnore }]
      : []),
  ];

  const eslintConfigSku: Linter.Config[] | undefined =
    eslintDecorator?.(_eslintConfigSku);

  return eslintConfigSku;
};

const skuContext = await getSkuContext();

export const eslintConfigSku = createEslintConfig(skuContext);
