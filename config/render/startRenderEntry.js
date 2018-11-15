import { renderApp, renderHTML } from '__sku_alias__renderEntry';
import config from './startConfig.json';

export default async renderContext => {
  const renderParams = { ...renderContext, ...config };

  const app = await renderApp(renderParams);

  const result = await renderHTML({ ...renderParams, app });

  return result;
};
