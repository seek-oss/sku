# [Playroom](https://github.com/seek-oss/playroom)

Running `sku playroom` will open up a local component playroom.

By default, Playroom will try to import your components from `src/components/index.{js|ts}`. If you'd like to import from a different file, you'll need to provide a `playroomComponents` option in `sku.config.js`.

```js
module.exports = {
  playroomComponents: './src/components.js',
};
```

You can also provide themes and a frame component via the following options:

```js
module.exports = {
  playroomThemes: './src/themes.js',
  playroomFrameComponent: './src/playroom/FrameComponent.js',
};
```

To build the playroom, first add the following npm script:

```js
{
  "scripts": {
    "build-playroom": "sku build-playroom"
  }
}
```

Then run `npm run build-playroom`.

By default, Playroom assets are generated in the `dist-playroom` directory in your project root folder. If you would like to specify a custom target directory, you can provide it via the `playroomTarget` option in `sku.config.js`:

```js
module.exports = {
  playroomTarget: './dist/playroom',
};
```

By default, responsive viewports are rendered at 320, 768 and 1024 pixels wide. If you'd like to customise this, you can provide a `playroomWidths` option in `sku.config.js`:

```js
module.exports = {
  playroomWidths: [320, 1024],
};
```

By default, Playroom runs on port `8082`. If you'd like to use a different port, you can provide it via the `playroomPort` option in `sku.config.js`:

```js
module.exports = {
  playroomPort: 9000,
};
```

If you'd like to configure the playroom title, you can provide the following config:

```js
module.exports = {
  playroomTitle: 'My Components',
};
```
