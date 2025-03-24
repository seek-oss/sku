import { extensions } from '@/config/fileResolutionExtensions.js';

export * from './loaders.js';
export { resolvePackage } from './resolvePackage.js';

export const TYPESCRIPT = new RegExp(`\.(${extensions.ts.join('|')})$`);
export const JAVASCRIPT = new RegExp(`\.(${extensions.js.join('|')})$`);
export const IMAGE = [
  /\.bmp$/,
  /\.gif$/,
  /\.jpe?g$/,
  /\.png$/,
  /\.webp$/,
  /\.avif$/,
];
export const SVG = /\.svg$/;
