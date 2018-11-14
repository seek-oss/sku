const fileName = 'message';

export const renderApp = () =>
  import(`./message/${fileName}`).then(({ message }) => message);

export const renderHTML = ({ app, bodyTags, headTags }) => `
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
`;
