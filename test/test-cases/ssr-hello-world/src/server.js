const dedent = require('dedent');

const template = ({ publicPath, message }) => dedent`
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

const fileName = 'message';

export default ({ publicPath }) => ({
  renderCallback: async (req, res) => {
    const { message } = await import(`./message/${fileName}`);
    res.send(template({ publicPath, message }));
  }
});
