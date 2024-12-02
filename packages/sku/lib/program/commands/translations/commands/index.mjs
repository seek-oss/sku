import { pullCommand } from './pull/pull.command.mjs';
import { pushCommand } from './push/push.command.mjs';
import { compileCommand } from './compile/compile.command.mjs';
import { validateCommand } from './validate/validate.command.mjs';
/* [add-sku-command-generator: import] */

export const commands = [
  pullCommand,
  pushCommand,
  compileCommand,
  validateCommand,
  /* [add-sku-command-generator: invocation] */
];
