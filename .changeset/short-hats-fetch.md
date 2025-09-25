---
'sku': major
---

**Breaking changes to configuration handling:**

1. **Custom config file validation**: `sku` no longer falls back to default sku config files when the config file specified with the `--config` flag cannot be found. It will now throw an error and exit the program instead. This ensures users are aware that the configuration file is either missing or incorrectly specified, rather than silently falling back to a default configuration that may not be appropriate for their use case. If you encounter this error, ensure that the `--config` flag points to a valid configuration file.

2. **Default entry file extensions**: Default values for entry files now use `.tsx` extensions instead of `.js`:
   - `clientEntry`: `'src/client.js'` → `'src/client.tsx'`
   - `renderEntry`: `'src/render.js'` → `'src/render.tsx'`  
   - `serverEntry`: `'src/server.js'` → `'src/server.tsx'`

   Existing projects with `.js` entry files will need to either rename their files to `.tsx` or explicitly specify the `.js` paths in their sku config.