---
'sku': minor
---

Managed Data Mode SSR: Add `cspExtraSources` and `cspReportOnlyExtraSources` options to extend individual CSP directives

Each option is a map from directive name to extra sources.
The supported directives are `script-src`, `style-src`, `img-src`, `font-src`, `connect-src`, `frame-src`, `media-src`, `worker-src`, `manifest-src` and `form-action`.
A supported directive that sku doesn't emit by default is emitted as `'self'` plus the configured sources.
`cspReportOnlyExtraSources` defaults to `cspExtraSources`.

**EXAMPLE USAGE**:

```ts
export default {
  bundler: 'vite',
  buildType: 'ssr',
  cspEnabled: true,
  cspExtraSources: {
    'connect-src': ['https://browser-intake-datadoghq.com'],
  },
} satisfies SkuConfig;
```

**BREAKING CHANGE (experimental SSR only)**:

`cspExtraScriptSrcHosts` and `cspReportOnlyExtraScriptSrcHosts` are no longer supported with `buildType: 'ssr'` and fail config validation.
Move their hosts to the `script-src` key of the new options:

```diff
 export default {
   bundler: 'vite',
   buildType: 'ssr',
-  cspExtraScriptSrcHosts: ['https://cdn.example.com'],
-  cspReportOnlyExtraScriptSrcHosts: ['https://report-only.example.com'],
+  cspExtraSources: {
+    'script-src': ['https://cdn.example.com'],
+  },
+  cspReportOnlyExtraSources: {
+    'script-src': ['https://report-only.example.com'],
+  },
 } satisfies SkuConfig;
```

Static and webpack apps keep using `cspExtraScriptSrcHosts`, and fail config validation if they set the new options.
