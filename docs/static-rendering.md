# Static rendering

Client-side apps (spas) all suffer the same performance pitfall of not being able to show any content until the javascript is downloaded, parsed and run. The user sees a blank white screen until this has all occurred, which is often followed by a loading indicator while data is fetched from the network. To improve perceived performance, `sku` renders all the static content of your app at build time.

To achieve this, `sku` apps have a special render entry point like the following.

```js
import React from 'react';
import { renderToString } from 'react-dom/server';

import App from './App';

export default {
  renderApp: () => renderToString(<App />),

  renderDocument: ({ app, bodyTags, headTags }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>My Awesome Project</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${headTags}
      </head>
      <body>
        <div id="app">${app}</div>
        ${bodyTags}
      </body>
    </html>
  `
};
```

## API

### `renderApp`

Render the app (generally using `React.renderToString`) and returns it. You can also return other values (eg. extracted meta information, css styles, etc). Anything returned will be available in `renderDocument`.

The options

| param       | description                                |
| ----------- | ------------------------------------------ |
| environment | The environment to render eg. `production` |
| site        | The site to render eg. `au` or `jobstreet` |
| routeName   |                                            |
| route       |                                            |

`renderapp`
Should return the app rendered to html string for the given context Params.

- environment
- site
- route

renderDocument
Should return the html for the given route

- environment
- site
- route
- app - the app html from renderApp
- headtags - html tags to be placed in the head of the html
- bodytags - html tags to be placed at the end of the html body
