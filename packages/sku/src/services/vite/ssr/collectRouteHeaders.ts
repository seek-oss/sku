import type { StaticHandlerContext } from 'react-router';

/** Merge RR loader/action headers from all matches (append for Set-Cookie). */
export const collectRouteHeaders = (context: StaticHandlerContext): Headers => {
  const headers = new Headers();
  for (const { route } of context.matches) {
    const routeId = route.id;
    if (!routeId) {
      continue;
    }
    const loaderHeaders = context.loaderHeaders[routeId];
    const actionHeaders = context.actionHeaders[routeId];
    loaderHeaders?.forEach((value, name) => {
      headers.append(name, value);
    });
    actionHeaders?.forEach((value, name) => {
      headers.append(name, value);
    });
  }
  return headers;
};
