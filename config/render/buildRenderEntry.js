import render from '__sku_alias__renderEntry'; // eslint-disable-line import/no-unresolved

export default async ({ headTags, bodyTags, ...renderParams }) => {
  const app = await render.renderApp(renderParams);

  return await render.renderDocument({
    headTags,
    bodyTags,
    ...renderParams,
    app
  });
};
