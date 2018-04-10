const dedent = require('dedent');

const fileName = 'message';

export default async ({ publicPath }) => {
  const { message } = await import(`./message/${fileName}`);
  
  return dedent`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>hello-world</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <div id="app" data-message="${message}"></div>
        <script type="text/javascript" src="${publicPath}main.js"></script>
      </body>
    </html>
  `;
};
