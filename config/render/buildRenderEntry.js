import { renderApp, renderHTML } from '__sku_alias__renderEntry'; // eslint-disable-line import/no-unresolved

export default async renderParams => {
  const app = await renderApp(renderParams);

  return await renderHTML({ ...renderParams, app });
};
