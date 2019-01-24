// __sku_alias__renderEntry is a webpack alias
// pointing to the consuming apps render entry
import render from '__sku_alias__renderEntry';

export default async ({ headTags, bodyTags, ...renderParams }) => {
  const app = await render.renderApp(renderParams);

  return await render.renderDocument({
    headTags,
    bodyTags,
    ...renderParams,
    app
  });
};
