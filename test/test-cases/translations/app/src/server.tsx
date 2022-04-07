import React from 'react';
import { renderToString } from 'react-dom/server';
import { VocabProvider } from '@vocab/react';

import type { Request, Response } from 'express';

import App from './App';

const initialResponseTemplate = ({ headTags }: any) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>hello-world</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${headTags}
`;

const template = ({ headTags, bodyTags, app }: any) => `
      ${headTags}
    </head>
    <body>
      <div id="app">${app}</div>
      ${bodyTags}
    </body>
  </html>
`;

export default () => ({
  renderCallback: async (
    { SkuProvider, getBodyTags, flushHeadTags, addLanguageChunk }: any,
    req: Request,
    res: Response,
  ) => {
    res.status(200).write(
      initialResponseTemplate({
        headTags: flushHeadTags(),
      }),
    );
    await Promise.resolve();
    const isPseudo = Boolean(req.query['pseudo']);
    const pathLanguage = req.url.includes('fr') ? 'fr' : 'en';
    const language = isPseudo ? 'en-PSEUDO' : pathLanguage
    addLanguageChunk(language);

    const app = renderToString(
      <SkuProvider>
        <VocabProvider language={language}>
          <App />
        </VocabProvider>
      </SkuProvider>,
    );
    res.write(
      template({
        headTags: flushHeadTags(),
        bodyTags: getBodyTags(),
        app,
      }),
    );
    res.end();
  },
});
