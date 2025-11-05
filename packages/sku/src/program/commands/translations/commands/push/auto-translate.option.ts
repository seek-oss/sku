import { Option } from 'commander';

export const autoTranslateOption = new Option(
  '--auto-translate',
  'Automatically translate new keys using machine translation',
).default(false);
