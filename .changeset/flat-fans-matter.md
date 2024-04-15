---
'sku': minor
---

Add `dom.iterable` to the tsconfig `lib` compiler option

This change provides type definitions for iterable APIs on some DOM APIs. For example, this enables using [`for...of` syntax] or the [`keys()`] method on `URLSearchParams`:

```ts
const params = new URLSearchParams('a=1&b=2'});

for (const [key, value] of params) {
  // Prints 'a 1' and 'b 2'
  console.log(key, value);
}

for (const key of params.keys()) {
  // Prints 'a' and 'b'
  console.log(key);
}
```

[`for...of` syntax]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of
[`keys()`]: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/keys
