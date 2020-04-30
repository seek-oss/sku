---
'sku': minor
---

Add environment arg support to `sku start`

`sku start` defaults to using the first environment in your `environments` array. You can now specify any environment via the `--environment` argument, mimicking the `sku serve` behaviour. 

```bash
$ sku start --environment production
```
