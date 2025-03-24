export default {
  bundler: 'vite',
  port: 9843,
  httpsDevServer: true,
  devServerMiddleware: './dev-middleware.vite.js',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
};
