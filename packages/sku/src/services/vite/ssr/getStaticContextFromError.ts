import {
  isRouteErrorResponse,
  type DataRouteObject,
  type StaticHandlerContext,
} from 'react-router';

/**
 * Build a static render context that already carries a route error.
 * Used after a Component or Suspense throw during the first SSR stream so a
 * second pass can render the nearest ErrorBoundary with status 500 (or the
 * status from a route error response) instead of failing the HTML response.
 */
export const getStaticContextFromError = (
  routes: DataRouteObject[],
  handlerContext: StaticHandlerContext,
  error: unknown,
): StaticHandlerContext => {
  const errorBoundaryId =
    handlerContext._deepestRenderedBoundaryId ?? routes[0]?.id;
  if (!errorBoundaryId) {
    throw error;
  }
  return {
    ...handlerContext,
    statusCode: isRouteErrorResponse(error) ? error.status : 500,
    errors: { [errorBoundaryId]: error },
  };
};
