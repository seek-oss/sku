import App from './App';

export default () => ({
  renderApp: ({ SkuProvider, renderToStringAsync, HeadTags, BodyTags }) =>
    renderToStringAsync(
      <html>
        <head>
          <meta charSet="UTF-8" />
          <title>hello-world</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <HeadTags />
        </head>
        <body>
          <div id="app">
            <SkuProvider>
              <App />
            </SkuProvider>
          </div>
          <BodyTags />
          <script src="https://code.jquery.com/jquery-3.5.0.slim.min.js" />
          {/* <script>console.log('Hi');</script> */}
        </body>
      </html>,
    ),

  /**
   * This approach can work, but React meta tags won't be hoisted to the top of the document.
   * If we want that to work we need to `renderToString` with the header and body elements in place.
   */
  // renderDocument: ({ getBodyTags, getHeadTags, getAppOutlet }) => /* html */ `
  //   <!DOCTYPE html>
  //   <html>
  //     <head>
  //       <meta charset="UTF-8" />
  //       <title>hello-world</title>
  //       <meta name="viewport" content="width=device-width, initial-scale=1" />
  //       ${getHeadTags()}
  //     </head>
  //     <body>
  //       <div id="app">${getAppOutlet()}</div>
  //       ${getBodyTags()}
  //       <script src="https://code.jquery.com/jquery-3.5.0.slim.min.js"></script>
  //       <script>console.log('Hi');</script>
  //     </body>
  //   </html>
  // `,

  onStart: async () => {
    console.log('Server ran the onStart callback');
  },
  middleware: [
    (req, _res, next) => {
      console.log('Middleware ran for', req.url);
      next();
    },
  ],
});
