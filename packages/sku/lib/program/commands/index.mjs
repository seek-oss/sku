import { initCommand } from './init/init.command.mjs';
import { buildSsrCommand } from './build-ssr/build-ssr.command.mjs';
import { configureCommand } from './configure/configure.command.mjs';
import { formatCommand } from './format/format.command.mjs';
import { lintCommand } from './lint/lint.command.mjs';
import { preCommitCommand } from './pre-commit/pre-commit.command.mjs';
import { serveCommand } from './serve/serve.command.mjs';
import { setupHostsCommand } from './setup-hosts/setup-hosts.command.mjs';
import { startCommand } from './start/start.command.mjs';
import { startSsrCommand } from './start-ssr/start-ssr.command.mjs';
import { translationsCommand } from './translations/translations.command.mjs';
import { buildCommand } from './build/build.command.mjs';
import { testCommand } from './test/test.command.mjs';
/* [add-sku-command-generator: import] */

export const commands = [
  initCommand,
  buildSsrCommand,
  configureCommand,
  formatCommand,
  lintCommand,
  preCommitCommand,
  serveCommand,
  setupHostsCommand,
  startCommand,
  startSsrCommand,
  translationsCommand,
  buildCommand,
  testCommand,
  /* [add-sku-command-generator: invocation] */
];
