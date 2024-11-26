const initCommand = require('./init/init.command');
const buildSsrCommand = require('./build-ssr/build-ssr.command');
const configureCommand = require('./configure/configure.command');
const formatCommand = require('./format/format.command');
const lintCommand = require('./lint/lint.command');
const preCommitCommand = require('./pre-commit/pre-commit.command');
const serveCommand = require('./serve/serve.command');
const setupHostsCommand = require('./setup-hosts/setup-hosts.command');
const startCommand = require('./start/start.command');
const startSsrCommand = require('./start-ssr/start-ssr.command');
const translationsCommand = require('./translations/translations.command');
const buildCommand = require('./build/build.command');
const testCommand = require('./test/test.command');
/* [add-command-generator: import] */

const commands = [
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
  /* [add-command-generator: invocation] */
];

module.exports = commands;
