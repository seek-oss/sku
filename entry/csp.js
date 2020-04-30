import { parse } from 'node-html-parser';

export default function createCSPHandler() {
  const hosts = [];
  const shas = [];

  const trackScriptContents = (contents) => {};

  return {
    addInlineScript: () => {},
    handleHtml: (html) => {
      const root = parse(html, { script: true });

      if (!root.valid) {
        throw new Error('Invalid HTML');
      }

      root.querySelectorAll('script').forEach((script) => {
        const src = script.getAttribute('src');

        if (src) {
          console.log('Found external', script.toString());
        } else if (script.getAttribute('type') !== 'application/json') {
          console.log('Found inline script', script.toString());
        }
      });
    },
  };
}
