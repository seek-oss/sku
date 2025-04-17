---
'sku': minor
---

Add Port and Strict Port toggle for Start and Serve

Previously `sku serve` would allow you to choose the port to use with `--port`. This is now available on `sku start`.

**Start development server using port 8080:**
```sh
sku start --port 8080
```

By default, if this port is unavailable a new port will be chosen. If you'd instead prefer to the command to fail, the `--strict-port` in now available.

**Fails if port not available:**

```sh
sku serve --port 8080 --strict-port
```