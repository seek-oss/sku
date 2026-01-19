import { Option } from 'commander';

export const autoTranslateOption = new Option(
  '--auto-translate',
  'Enable automatic translation for missing translations',
).default(false);
