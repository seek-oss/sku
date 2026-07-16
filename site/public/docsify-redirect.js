// Redirect legacy docsify hash routes (e.g. /sku/#/./docs/vite?id=foo)
// to VitePress paths (e.g. /sku/docs/vite#foo).
const { pathname, hash } = window.location;

if ((pathname === '/sku/' || pathname === '/sku') && hash.startsWith('#/')) {
  const [pathPart, query] = hash.slice(2).split('?');
  const path = pathPart.replace(/^\.\//, '').replace(/\.md$/, '');

  if (path && !path.includes('..')) {
    const id = query
      ?.split('&')
      .find((param) => param.startsWith('id='))
      ?.slice(3);

    window.location.replace(`/sku/${path}${id ? `#${id}` : ''}`);
  }
}
