// @ts-ignore TS1479
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  serverEntry: 'src/server.tsx',
  port: 8239,
  serverPort: 8011,
  setupTests: './jestSetup.js',
} satisfies SkuConfig;
