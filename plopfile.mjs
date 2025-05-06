import camelCaseHelper from './plop/helpers/camel-case-helper.mjs';
import addSkuCommandGenerator from './plop/generators/add-sku-command/index.mjs';
import addSkuCodemodGenerator from './plop/generators/add-sku-codemod/index.mjs';

const plopFile = (plop) => {
  // Helpers
  camelCaseHelper(plop);
  // Commands
  addSkuCommandGenerator(plop);
  addSkuCodemodGenerator(plop);
};

export default plopFile;
