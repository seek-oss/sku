const { pathname, hash, search } = window.location;

// Redirect legacy docsify hash routes (e.g. /sku/#/./docs/vite?id=foo)
if ((pathname === '/sku/' || pathname === '/sku') && hash.startsWith('#/')) {
  const [pathPart, query] = hash.slice(2).split('?');
  const path = pathPart
    .replace(/^\.\//, '')
    .replace(/\.md$/, '')
    .replace(/^docs\//, '');

  if (path && !path.includes('..')) {
    const id = query
      ?.split('&')
      .find((param) => param.startsWith('id='))
      ?.slice(3);

    window.location.replace(`/sku/${path}${id ? `#${id}` : ''}`);
  }
}

// Redirect old `/sku/docs` to `/sku/`. Pages no longer require a docs prefix.
const docsPrefix = '/sku/docs';
if (pathname === docsPrefix || pathname.startsWith(`${docsPrefix}/`)) {
  const rest =
    pathname === docsPrefix || pathname === `${docsPrefix}/`
      ? ''
      : pathname.slice(docsPrefix.length + 1);

  window.location.replace(`/sku/${rest}${search}${hash}`);
}

// Redirect specific removed docs pages
const redirects = [
  ['faq', 'support'],
  ['server-rendering', 'ssr'],
];

redirects.forEach(([from, to]) => {
  if (pathname === `/sku/${from}` || pathname === `/sku/${from}/`) {
    window.location.replace(`/sku/${to}${search}${hash}`);
  }
});
