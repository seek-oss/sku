---
'sku': major
---

Update to ESLint v9

ESLint v9 defaults to the new [flat config format]. As such, `sku`'s ESLint config has been migrated to this new format, and consumers will need to migrate any custom overrides set via `dangerouslySetESLintConfig` to the new format as well.

For example, if you are overriding an ESLint rule, you can migrate to the new config format like so:

```diff
dangerouslySetESLintConfig: (config) => {
-  return {
-    ...config,
-    rules: {
-      ...config.rules,
-      'no-console': 'off'
-    }
-  };
+  return [
+    ...config,
+    {
+      rules: {
+        'no-console': 'off'
+      }
+    }
+  ];
}
```

More complicated overrides such as the use of plugins or modification of parser options may require a more involved migration. Please refer to the [migration guide] for more information.

Additionally, the `.eslintignore` file is no longer used by ESLint. Instead, [ignore patterns] are now configured directly in your ESLint config file. Since `sku` controls your ESLint config, you can configure any custom ignore patterns in your sku config via the new `eslintIgnore` option.

For example:

```ts
import type { SkuConfig } from 'sku';

export default {
  eslintIgnore: ['a-large-file.js', '**/generated/]
} satisfies SkuConfig;
```

> [!TIP]
> Upon installation, `sku` will automatically try to migrate any custom entries in your `.eslintignore` to the new `eslintIgnore` configuration.
> **This migration must be done locally, it will not be committed to your repository from CI.**
> If this migration fails, you will need to manually migrate any custom ignore entries.

> [!IMPORTANT]
> Changes to ignore patterns or other ESLint configuration via `eslintIgnore` and `dangerouslySetESLintConfig` respectively will no longer be reflected directly in your `eslint.config.js` file.
> The `sku/config/eslint` entrypoint handles the composition of these configurations.
> The best way to visualize your final ESLint configuration is use the official [ESLint config inspector].

[flat config format]: https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects
[migration guide]: https://eslint.org/docs/latest/use/configure/migration-guide
[ignore patterns]: https://eslint.org/docs/latest/use/configure/ignore
[ESLint config inspector]: https://github.com/eslint/config-inspector
