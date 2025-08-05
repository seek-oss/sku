import { addSkuCommandGenerator } from './generators/add-sku-command/index.js';
import { addSkuCodemodGenerator } from './generators/add-sku-codemod/index.js';

/** @param {import('plop').NodePlopAPI} plop*/
export default (plop) => {
  // Commands
  addSkuCommandGenerator(plop);
  addSkuCodemodGenerator(plop);
};
