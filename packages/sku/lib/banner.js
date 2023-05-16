const chalk = require('chalk');
const wrap = require('wrap-ansi');
const identString = require('indent-string');

/**
 * @param {'info' | 'error' | 'warning'} type
 * @param {string} heading
 * @param {string[]} messages
 *
 * */
const banner = (type, heading, messages = []) => {
  let highlight;

  switch (type) {
    case 'info': {
      highlight = chalk.blue;
      break;
    }
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

  const columns = process.stdout.columns <= 0 ? 80 : process.stdout.columns;
  const gutter = 4;
  const fullWidth = columns < 80 ? columns : 80;
  const contentWidth = fullWidth - gutter * 2;

  const border = highlight(Array(fullWidth).fill('-').join(''));

  const renderContent = (message) =>
    identString(wrap(message, contentWidth), gutter);

  console.log(`
${border}

${renderContent(chalk.bold(highlight(heading)))}

${renderContent(messages.join('\n\n'))}

${border}
  `);
};

module.exports = banner;
