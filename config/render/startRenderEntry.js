import { renderApp, renderHTML } from '__sku_alias__renderEntry';
import config from './startConfig.json';

export default renderContext => {
  const renderParams = { ...renderContext, ...config };

  const app = renderApp(renderParams);

  const result = renderHTML({ ...renderParams, app });

  console.log('LOOK', result);
  return result;
};
