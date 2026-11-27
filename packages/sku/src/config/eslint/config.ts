import type { Linter } from 'eslint';

import { importOrderConfig } from './importOrder.js';
import { createEslintIgnoresConfig } from './ignores.js';
import { getSkuContext } from '../../context/createSkuContext.js';
import { createJsonFilesConfig } from './jsonFiles.js';

export const createEslintConfig = async ({
  configPath,
}: {
  configPath?: string;
} = {}): Promise<Linter.Config[]> => {
  const skuContext = await getSkuContext({ configPath });
  const { eslintDecorator, eslintIgnore, languages, paths } = skuContext;
  const { relativeTarget } = paths;

  const { default: eslintConfigSeek } =
    await import('eslint-config-seek/vitest');

  const _eslintConfigSku: Linter.Config[] = [
    createEslintIgnoresConfig({
      hasLanguagesConfig: Boolean(languages && languages.length > 0),
      target: relativeTarget,
    }),
    ...createJsonFilesConfig(),
    ...eslintConfigSeek,
    importOrderConfig,
    ...(eslintIgnore && eslintIgnore.length > 0
      ? // Spread here to turn a read-only array into a mutable one
        [{ ignores: [...eslintIgnore] }]
      : []),
  ];

  const eslintConfigSku: Linter.Config[] | undefined =
    eslintDecorator?.(_eslintConfigSku);

  return eslintConfigSku;
};
