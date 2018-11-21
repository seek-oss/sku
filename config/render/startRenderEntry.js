import render from '__sku_alias__renderEntry'; // eslint-disable-line import/no-unresolved
import config from './startConfig.json'; // eslint-disable-line import/no-unresolved

export default async ({ headTags, bodyTags, ...renderContext }) => {
  const renderParams = { ...renderContext, ...config };

  const app = await render.renderApp(renderParams);

  const result = await render.renderDocument({
    headTags,
    bodyTags,
    ...renderParams,
    app
  });

  return result;
};
