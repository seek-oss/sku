// TODO: Figure out a better way to share this config. This is currently copy-pasted from
// `eslint-config-seek`
export const extensions = {
  js: ['js', 'jsx', 'mjs', 'cjs'],
  ts: ['ts', 'tsx', 'mts', 'cts'],
};

const prependDot = (ext: string) => `.${ext}`;

export const rootResolutionFileExtensions = [
  ...extensions.ts.map(prependDot),
  ...extensions.js.map(prependDot),
  '.json',
];
