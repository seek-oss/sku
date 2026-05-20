import wrap from 'wrap-ansi';
import identString from 'indent-string';
import { strong, critical, info, caution } from './styles.js';

export const banner = (
  type: 'info' | 'critical' | 'caution',
  heading: string,
  messages: string[] = [],
) => {
  const highlightMap = {
    info,
    critical,
    caution,
  };

  if (!(type in highlightMap)) {
    throw new Error(`Banner type not implemented: ${type}`);
  }

  const columns = process.stdout.columns <= 0 ? 80 : process.stdout.columns;
  const gutter = 4;
  const fullWidth = columns < 80 ? columns : 80;
  const contentWidth = fullWidth - gutter * 2;

  const highlight = highlightMap[type];
  const border = highlight(Array(fullWidth).fill('-').join(''));

  const renderContent = (message: string) =>
    identString(wrap(message, contentWidth), gutter);

  console.log(`
${border}

${renderContent(strong(highlight(heading)))}

${renderContent(messages.join('\n\n'))}

${border}
  `);
};
