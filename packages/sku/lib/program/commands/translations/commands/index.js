const pullCommand = require('./pull/pull.command.js');
const pushCommand = require('./push/push.command.js');
const compileCommand = require('./compile/compile.command.js');
const validateCommand = require('./validate/validate.command.js');
/* [add-sku-command-generator: import] */

const commands = [
  pullCommand,
  pushCommand,
  compileCommand,
  validateCommand,
  /* [add-sku-command-generator: invocation] */
];

module.exports = commands;
