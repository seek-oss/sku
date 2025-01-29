import { pullCommand } from './pull/pull.command.js';
import { pushCommand } from './push/push.command.js';
import { compileCommand } from './compile/compile.command.js';
import { validateCommand } from './validate/validate.command.js';
/* [add-sku-command-generator: import] */

export const commands = [
  pullCommand,
  pushCommand,
  compileCommand,
  validateCommand,
  /* [add-sku-command-generator: invocation] */
];
