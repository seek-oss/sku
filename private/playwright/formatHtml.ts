import diffableHtml from 'diffable-html';

function replaceRandomStrings(html: string): string {
  // Replace nonce values
  const nonceMatch = html.match(/nonce-([a-zA-Z0-9+/=]+)/);
  if (nonceMatch) {
    const nonceValue = nonceMatch[1];
    return html.replaceAll(nonceValue, 'RANDOM_NONCE');
  }
  return html;
}

export const formatHtml = (html: string) => {
  const formatted = diffableHtml(html).trim();
  return replaceRandomStrings(formatted);
};
