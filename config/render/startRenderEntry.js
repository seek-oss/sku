import { renderApp, renderHTML } from '__sku_alias__renderEntry'; // eslint-disable-line import/no-unresolved
import config from './startConfig.json'; // eslint-disable-line import/no-unresolved

export default async renderContext => {
  const renderParams = { ...renderContext, ...config };

  const app = await renderApp(renderParams);

  const result = await renderHTML({ ...renderParams, app });

  return result;
};
