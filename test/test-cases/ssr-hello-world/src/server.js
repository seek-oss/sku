const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>hello-world</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <div id="app"></div>
      <script type="text/javascript" src="http://localhost:8000/main.js"></script>
    </body>
  </html>
`;

export default {
  renderCallback: (req, res) => {
    res.send(html);
  }
};
