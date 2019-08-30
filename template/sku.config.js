module.exports = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  sites: [
    <%- sites %>
  ],
  publicPath: '/path/to/public/assets/', // <-- Required for sku build output
};
