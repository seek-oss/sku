import { renderApp, renderHTML } from '__sku_alias__renderEntry';

export default renderParams => {
  const app = renderApp(renderParams);

  return renderHTML({ ...renderParams, app });
};
