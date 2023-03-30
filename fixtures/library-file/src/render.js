import dedent from 'dedent';

export default {
  renderDocument: ({ libraryName, headTags, bodyTags }) => dedent`
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>My Awesome Project</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${headTags}
    </head>
    <body>
      ${bodyTags}
      <script>window.${libraryName}();</script>
    </body>
  </html>
`,
};
