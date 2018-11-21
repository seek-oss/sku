import dedent from 'dedent';

const fileName = 'message';

export default {
  renderApp: () =>
    import(`./message/${fileName}`).then(({ message }) => message),

  renderDocument: ({ app, bodyTags, headTags }) => dedent`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>hello-world</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
      </head>
      <body>
        <div id="app" data-message="${app}"></div>
        ${bodyTags}
      </body>
    </html>
  `
};
