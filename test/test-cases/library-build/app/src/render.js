export default ({ publicPath, libraryName }) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>My Awesome Project</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" type="text/css" href="${publicPath}${libraryName}.css" />
    </head>
    <body>
      <script type="text/javascript" src="${publicPath}${libraryName}.js"></script>
      <script>window.${libraryName}();</script>
    </body>
  </html>
`;
