const template = ({ headTags, bodyTags, message }) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>hello-world</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${headTags}
    </head>
    <body>
      <div id="app" data-message="${message}"></div>
      ${bodyTags}
    </body>
  </html>
`;

const fileName = 'message';

export default ({ headTags, bodyTags }) => ({
  renderCallback: (req, res) => {
    import(`./message/${fileName}`).then(({ message }) => {
      res.send(template({ headTags, bodyTags, message }));
    });
  }
});
