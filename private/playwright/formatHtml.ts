import diffableHtml from 'diffable-html';

export const formatHtml = (html: string) => diffableHtml(html).trim();
