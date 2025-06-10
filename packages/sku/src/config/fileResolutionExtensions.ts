// TODO: Figure out a better way to share this config. This is currently copy-pasted from
// `eslint-config-seek`
export const extensions = {
  js: ['mjs', 'cjs', 'js', 'jsx'],
  ts: ['mts', 'cts', 'ts', 'tsx'],
};

const prependDot = (ext: string) => `.${ext}`;

export const rootResolutionFileExtensions = [
  ...extensions.js.map(prependDot),
  '.json',
  ...extensions.ts.map(prependDot),
];
