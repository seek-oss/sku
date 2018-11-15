import { renderApp, renderHTML } from '__sku_alias__renderEntry';

export default async renderParams => {
  const app = await renderApp(renderParams);

  return await renderHTML({ ...renderParams, app });
};
