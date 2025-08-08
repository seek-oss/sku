---
'sku': minor
---

Add pathAliases configuration for custom import paths with Vite bundler.

## New pathAliases config

The `pathAliases` option provides a clean way to configure custom import paths:

```typescript
// sku.config.ts
export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  pathAliases: {
    '@components/*': './src/components/*',
    '@utils/*': './src/utils/*', 
    '@assets/*': './src/assets/*',
  },
} satisfies SkuConfig;
```

This enables imports like:
```typescript
import { Button } from '@components/Button';
import { formatDate } from '@utils/dateHelpers';
```

## Migration from dangerouslySetTSConfig

If you're currently using `dangerouslySetTSConfig` for TypeScript path mapping, you can migrate to the cleaner `pathAliases` approach:

**Before:**
```typescript
export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  dangerouslySetTSConfig: (config) => ({
    ...config,
    compilerOptions: {
      ...config.compilerOptions,
      paths: {
        '@components/*': ['./src/components/*'],
        '@utils/*': ['./src/utils/*'],
      },
    },
  }),
} satisfies SkuConfig;
```

**After:**
```typescript
export default {
  __UNSAFE_EXPERIMENTAL__bundler: 'vite',
  pathAliases: {
    '@components/*': './src/components/*',
    '@utils/*': './src/utils/*',
  },
} satisfies SkuConfig;
```

**Notes**

- **Automatic src/* alias**: sku provides `src/*` -> `./src/*` by default
- **Bundler support**: Only available with Vite bundler
- **Validation**: Prevents aliases from pointing to node_modules

## Bug fixes

- Fixes TypeScript paths configuration conflict by removing conflicting `paths: { '*': ['*'] }` setting
