---
'sku': minor
---

Any app that configures `languages` will automatically have the `en-PSEUDO` language generated for them.
`en-PSEUDO` is a generated language based off existing `en` translation messages.
An explanation of the pseudo-localization process, as well as possible use cases for this language, can be found in [the Vocab docs].

`en-PSEUDO` can be consumed just like any other language in your app:

```jsx
const App = () => <VocabProvider language="en-PSEUDO">...</VocabProvider>;
```

[the vocab docs]: https://github.com/seek-oss/vocab#pseudo-localization
