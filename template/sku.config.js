module.exports = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  environments: ['development', 'production'],
  publicPath: '/path/to/public/assets/', // <-- Required for sku build output
  orderImports: true
};
