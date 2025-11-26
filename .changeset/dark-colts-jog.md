---
'sku': minor
---

New `createUnsafeNonce` allows inserting [nonce] values in [Content Security Policy (CSP)] Tag.

Nonce's can be used to permit inline scripts that are generated after the initial render.
Nonce's will allow dynamic scripts to run without validation.
Please consider if other options can be used and if using this feature is safe for your use-case.

```ts
// render.tsx
export default {
  renderApp: ({ createUnsafeNonce }) => {
    const appHtml = renderToString(<App />);
    const dynamicScriptNonce = createUnsafeNonce();

    return { appHtml, dynamicScriptNonce };
  },
  // ...
}
```


[nonce]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce
[Content Security Policy (CSP)]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy