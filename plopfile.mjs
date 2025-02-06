import addSkuCommandGenerator from './plop/generators/add-sku-command/index.mjs';
import camelCaseHelper from './plop/helpers/camel-case-helper.mjs';

const plopFile = (plop) => {
  // Helpers
  camelCaseHelper(plop);
  // Commands
  addSkuCommandGenerator(plop);
};

export default plopFile;
