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

  const formatedMessages = messages
    .map((message) => identString(wrap(message, 80), 4))
    .join('\n\n');

  console.log(`
${highlight(
  '-------------------------------------------------------------------------------------------',
)}
  
    ${chalk.bold(highlight(heading))}
  
${formatedMessages}
  
${highlight(
  '-------------------------------------------------------------------------------------------',
)}
  `);
};
