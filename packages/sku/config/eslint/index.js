// @ts-check
// @ts-expect-error `eslint-config-seek` has no types yet
import eslintConfigSeek from 'eslint-config-seek';
import { importOrderConfig } from './importOrder';
import { createEslintIgnoresConfig } from './ignores';
import {
  eslintDecorator,
  eslintIgnore,
  languages,
  paths,
} from '../../context/index.js';

const { relativeTarget } = paths;

const _eslintConfigSku = [
  createEslintIgnoresConfig({
    hasLanguagesConfig: Boolean(languages && languages.length > 0),
    target: relativeTarget,
  }),
  ...eslintConfigSeek,
  importOrderConfig,
  ...(eslintIgnore && eslintIgnore.length > 0
    ? [{ ignores: eslintIgnore }]
    : []),
];

export const eslintConfigSku = eslintDecorator?.(_eslintConfigSku);
