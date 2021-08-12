const chalk = require('chalk');
const wrap = require('wrap-ansi');
const identString = require('indent-string');

module.exports = (type, heading, messages = []) => {
  let highlight;

  switch (type) {
    case 'error': {
      highlight = chalk.red;
      break;
    }
    case 'warning': {
      highlight = chalk.yellow;
      break;
    }
    default: {
      throw new Error(`Banner type not implemented: ${type}`);
    }
  }

  const gutter = 4;
  const fullWidth = process.stdout.columns < 80 ? process.stdout.columns : 80;
  const contentWidth = fullWidth - gutter * 2;

  const border = highlight(Array(fullWidth).fill('-').join(''));

  const renderContent = (message) =>
    identString(wrap(message, contentWidth), gutter);

  console.log(`
${border}
  
${renderContent(chalk.bold(highlight(heading)))}
  
${renderContent(messages.join('\n'))}
  
${border}
  `);
};
