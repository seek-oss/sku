export * from './loaders';
export { resolvePackage } from './resolvePackage';

// TODO: Figure out a better way to share this config. This is currently copy-pasted from
// `eslint-config-seek`
const extensions = {
  js: ['js', 'cjs', 'mjs', 'jsx'],
  ts: ['ts', 'cts', 'mts', 'tsx'],
};

export const TYPESCRIPT = new RegExp(`\.(${extensions.ts.join('|')})$`);
export const JAVASCRIPT = new RegExp(`\.(${extensions.js.join('|')})$`);
export const IMAGE = [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/];
export const SVG = /\.svg$/;
