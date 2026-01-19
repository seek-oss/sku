import { renderToString } from 'react-dom/server';

import App from './App';

const initialResponseTemplate = ({ headTags }) => /* html */ `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>hello-world</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${headTags}
`;

const template = ({ headTags, bodyTags, app, context }) => /* html */ `
      ${headTags}
    </head>
    <body>
      <div id="app">${app}</div>
      <script id="render-context" type="application/json">${JSON.stringify(context)}</script>
      ${bodyTags}
    </body>
  </html>
`;

export default () => ({
  renderCallback: async (
    { SkuProvider, getBodyTags, flushHeadTags, createUnsafeNonce },
    _,
    res,
  ) => {
    const dynamicScriptNonce = createUnsafeNonce();

    res.status(200).write(
      initialResponseTemplate({
        headTags: flushHeadTags(),
      }),
    );
    await Promise.resolve();

    const app = renderToString(
      <SkuProvider>
        <App />
      </SkuProvider>,
    );
    res.write(
      template({
        headTags: flushHeadTags(),
        bodyTags: getBodyTags(),
        app,
        context: { dynamicScriptNonce },
      }),
    );
    res.end();
  },
  onStart: async () => {
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.log('Server ran the onStart callback');
    }
  },
});
