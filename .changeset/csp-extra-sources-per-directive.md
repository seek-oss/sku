---
'sku': minor
---

Managed Data Mode SSR: Add a `csp` option with peer `enforced` and `reportOnly` policies that can each extend individual CSP directives

Each policy is `true` (sku's directives with nothing extra) or an object with `extraSources` and `reportTo`.
Leave a policy out to turn it off.
The policies don't inherit from each other.

`extraSources` is a map from directive name to extra sources.
The supported directives are `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `media-src`, `worker-src`, `manifest-src` and `form-action`.
A supported directive that sku doesn't emit by default is emitted as `'self'` plus the configured sources.

`reportTo` is a URL.
sku names the reporting endpoints `csp` and `csp-report-only`.

**EXAMPLE USAGE**:

```ts
export default {
  bundler: 'vite',
  buildType: 'ssr',
  csp: {
    enforced: {
      extraSources: {
        'connect-src': ['https://browser-intake-datadoghq.com'],
      },
      reportTo: 'https://csp.example.com/report',
    },
  },
} satisfies SkuConfig;
```

**BREAKING CHANGE (experimental SSR only)**:

The flat `csp*` options are no longer supported with `buildType: 'ssr'` and fail config validation.
Move each one to its `csp` replacement:

| Flat option                        | `csp` replacement                           |
| ---------------------------------- | ------------------------------------------- |
| `cspEnabled: true`                 | `csp.enforced`                              |
| `cspExtraScriptSrcHosts`           | `csp.enforced.extraSources['script-src']`   |
| `cspReportTo`                      | `csp.enforced.reportTo`                     |
| `cspReportOnlyEnabled: true`       | `csp.reportOnly`                            |
| `cspReportOnlyExtraScriptSrcHosts` | `csp.reportOnly.extraSources['script-src']` |
| `cspReportOnlyReportTo`            | `csp.reportOnly.reportTo`                   |
| `cspDelivery`                      | Remove it. SSR always uses headers          |

`reportTo` only accepts a URL.
Replace an endpoint name or an `[endpoint, url]` tuple with its URL.

The report-only policy no longer defaults to the enforced policy's script hosts and `reportTo`.
If you relied on that, set the same values on both policies:

```diff
+const policy = {
+  extraSources: { 'script-src': ['https://cdn.example.com'] },
+  reportTo: 'https://csp.example.com/report',
+};
+
 export default {
   bundler: 'vite',
   buildType: 'ssr',
-  cspEnabled: true,
-  cspExtraScriptSrcHosts: ['https://cdn.example.com'],
-  cspReportTo: 'https://csp.example.com/report',
-  cspReportOnlyEnabled: true,
+  csp: { enforced: policy, reportOnly: policy },
 } satisfies SkuConfig;
```

Static and webpack apps keep using the flat options, and fail config validation if they set `csp`.
