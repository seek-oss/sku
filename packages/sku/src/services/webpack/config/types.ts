import type { SkuContext } from '#src/context/createSkuContext.js';

export interface MakeWebpackConfigOptions {
  isIntegration?: boolean;
  isDevServer?: boolean;
  metrics?: boolean;
  htmlRenderPlugin?: any;
  hot?: boolean;
  isStartScript?: boolean;
  stats?: string;
  clientPort?: number;
  serverPort?: number;
  skuContext: SkuContext;
}
