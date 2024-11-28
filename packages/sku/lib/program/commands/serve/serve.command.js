const { Command } = require('commander');
const siteOption = require('../../options/site/site.option');
const portOption = require('../../options/port/port.option');

const serve = new Command('serve');

serve
  .description(
    'Serve a production build of a statically-rendered application from your local machine.',
  )
  .addOption(siteOption)
  .addOption(portOption)
  .action(({ site, port }) => {
    const serveAction = require('./serve.action');
    serveAction({ site, port });
  });

module.exports = serve;
