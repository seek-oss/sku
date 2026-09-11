# Multi site (Theming)

sku can run a multi-site or multi-brand application using the [`sites`](./configuration#sites) option.

## Switching site by host

By default, sku renders the first site in the [`sites`](./configuration#sites) array when you use `sku start`.
If you want to switch between sites without restarting the server, set a `host` for each site.

```ts
export default {
  sites: [
    { name: 'seekAnz', host: 'au.seek.com.localhost' },
    { name: 'jobStreet', host: 'jobstreet.com.localhost' },
  ],
} satisfies SkuConfig;
```

If you request `http://au.seek.com.localhost`, you receive the `seekAnz` version of the app.
`http://jobstreet.com.localhost` returns the `jobStreet` version.

Prefer hostnames that end in `.localhost` for local development.
They resolve to your machine automatically in most environments.
You usually do not need `/etc/hosts` entries.

### Setup hosts

For hostnames that do not end in `.localhost`, switching site by host requires hosts that resolve to localhost.
sku can configure this for you.
You can also run `setup-hosts` for `.localhost` names if you want explicit hosts-file entries.

First add this script to your `package.json`.

```json
{
  "scripts": {
    "setup-hosts": "sku setup-hosts"
  }
}
```

Then run the script to configure your machine with the required hosts.

```sh
$ sudo npm run setup-hosts
```

> [!NOTE]
> Changing hosts configuration needs root privileges.

## Braid example

The following example uses this feature with [Braid](https://github.com/seek-oss/braid-design-system).
You can use this approach to vary your sites in any way.

> [!NOTE]
> Currently this example is for static rendering projects only.
> SSR projects can follow the same pattern.

### Config

First, add a [`sites`](./configuration#sites) option to your `sku.config.js`.
This tells sku to render a version of your app for each site you specify.

> [!NOTE]
> For this example to work, your sites need to match the available [themes in Braid](https://github.com/seek-oss/braid-design-system/tree/master/lib/themes).
> You could also map the theme name from your site.

```ts
export default {
  sites: ['seekAnz', 'jobStreet'],
} satisfies SkuConfig;
```

### Rendering the site

Handle the site variable in the render and client entries.

```tsx
// render.tsx
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { Render } from 'sku';

import App from './App';

export default {
  // Pass the site variable to your top level component
  renderApp: ({ site, SkuProvider }) => {
    return renderToString(
      <SkuProvider>
        <App site={site} />
      </SkuProvider>,
    );
  },

  // Make the site variable available for the client
  provideClientContext: ({ site }) => ({
    site,
  }),

  renderDocument: ({ app, headTags, bodyTags }) => `
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
  `,
} satisfies Render;
```

```tsx
// client.tsx
import React from 'react';
import { hydrateRoot } from 'react-dom/client';

import App from './App';

// Pass the site variable from `provideClientContext` to the top level component
export default ({ site }: { site: string }) =>
  hydrateRoot(document.getElementById('app')!, <App site={site} />);
```

### Loading the theme

The site is now available in the `App` component.
Use `BraidLoadableProvider` (which uses [loadable-components](./code-splitting) internally) to configure the specified theme.

```tsx
// App.tsx
import React, { ReactNode } from 'react';

import { BraidProvider } from 'braid-design-system';
import loadable from 'sku/@loadable/component';

const BraidTheme = loadable.lib(
  ({ themeName }: { themeName: string }) =>
    import(`braid-design-system/themes/${themeName}`),
);

export default ({ site }: { site: string }) => (
  <BraidTheme themeName={site}>
    {({ default: theme }) => (
      <BraidProvider theme={theme}>
        <MyPage />
      </BraidProvider>
    )}
  </BraidTheme>
);
```
