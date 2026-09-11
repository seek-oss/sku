// @ts-check
import options from '../../packages/sku/dist/config/prettier.mjs';
import 'prettier-plugin-sentences-per-line';

/** @type {import('prettier').Config} */
const config = {
  ...options,
  // Experimental Prettier CLI only accepts string plugin specifiers.
  plugins: ['prettier-plugin-sentences-per-line'],
  proseWrap: 'preserve',
};

export default config;
