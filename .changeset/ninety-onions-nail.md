---
'sku': minor
---

Any app that configures `languages` will automatically have the `en-PSEUDO` language generated for them.
`en-PSEUDO` is a generated language created by pseudo-localizing existing `en` translation messages in your app.
An explanation of the pseudo-localization process, as well as possible use cases for this language, can be found in [the Vocab docs].

`en-PSEUDO` can be consumed just like any other language in your app:

```jsx
const App = () => <VocabProvider language="en-PSEUDO">...</VocabProvider>;
```

**NB:** Statically-rendered apps will not be able to render an `en-PSEUDO` version of their app at build time.
If this is a use case that you would find useful, please reach out in #sku-support.

[the vocab docs]: https://github.com/seek-oss/vocab#pseudo-localization
