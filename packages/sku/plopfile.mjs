import addCommandGenerator from "./plop/generators/add-command/index.mjs";
import camelCaseHelper from "./plop/helpers/camel-case-helper.mjs";

const plopFile = (plop) => {
  // Helpers
  camelCaseHelper(plop);
  // Commands
  addCommandGenerator(plop);
}

export default plopFile;
