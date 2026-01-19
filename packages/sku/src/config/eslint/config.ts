import type { Linter } from 'eslint';

import { createImportOrderConfig } from './importOrder.js';
import { createEslintIgnoresConfig } from './ignores.js';
import { getSkuContext } from '../../context/createSkuContext.js';
import type { SkuConfig } from '../../types/types.js';
import { createJsonFilesConfig } from './jsonFiles.js';

export const createEslintConfig = async ({
  configPath,
}: {
  configPath?: string;
} = {}): Promise<Linter.Config[]> => {
  const skuContext = getSkuContext({ configPath });
  const { eslintDecorator, eslintIgnore, languages, paths, testRunner } =
    skuContext;
  const { relativeTarget } = paths;

  const { default: eslintConfigSeek } = await importEslintConfig({
    testRunner,
  });

  const _eslintConfigSku: Linter.Config[] = [
    createEslintIgnoresConfig({
      hasLanguagesConfig: Boolean(languages && languages.length > 0),
      target: relativeTarget,
    }),
    ...createJsonFilesConfig(),
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

async function importEslintConfig({
  testRunner = 'jest',
}: {
  testRunner: SkuConfig['testRunner'];
}): Promise<{ default: Linter.Config[] }> {
  if (testRunner === 'vitest') {
    return import('eslint-config-seek/vitest');
  }
  return import('eslint-config-seek');
}
