import initCommand from './init/init.command.js';
import buildSsrCommand from './build-ssr/build-ssr.command.js';
import configureCommand from './configure/configure.command.js';
import formatCommand from './format/format.command.js';
import lintCommand from './lint/lint.command.js';
import preCommitCommand from './pre-commit/pre-commit.command.js';
import serveCommand from './serve/serve.command.js';
import setupHostsCommand from './setup-hosts/setup-hosts.command.js';
import startCommand from './start/start.command.js';
import startSsrCommand from './start-ssr/start-ssr.command.js';
import translationsCommand from './translations/translations.command.js';
import buildCommand from './build/build.command.js';
import testCommand from './test/test.command.js';
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
