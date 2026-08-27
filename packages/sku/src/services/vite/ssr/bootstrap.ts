import { isRouteErrorResponse, type StaticHandlerContext } from 'react-router';
import serializeJavascript from 'serialize-javascript';
import type {
  DocumentAssets,
  JsonValue,
  SerializableHydrationState,
} from './types.js';

const escapeScriptValue = (value: unknown) =>
  serializeJavascript(value, { isJSON: true });

const replacePromises = (value: unknown): unknown => {
  if (value instanceof Promise) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(replacePromises);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        replacePromises(entry),
      ]),
    );
  }
  return value;
};

const serializeErrors = (
  errors: StaticHandlerContext['errors'],
  { development }: { development: boolean },
) => {
  if (!errors) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(errors).map(([key, error]) => {
      // Match React Router's serializeErrors markers so createBrowserRouter's
      // parseHydrationData / deserializeErrors can rebuild Error / ErrorResponse.
      if (isRouteErrorResponse(error)) {
        return [
          key,
          {
            status: error.status,
            statusText: error.statusText,
            data: error.data,
            // Runtime field required by isRouteErrorResponse / deserializeErrors.
            internal: (error as { internal?: boolean }).internal === true,
            __type: 'RouteErrorResponse',
          },
        ];
      }
      if (error instanceof Error) {
        return [
          key,
          {
            message: error.message,
            __type: 'Error',
            ...(error.name !== 'Error' ? { __subType: error.name } : {}),
            ...(development && error.stack ? { stack: error.stack } : {}),
          },
        ];
      }
      return [key, error];
    }),
  );
};

export const buildBootstrapScriptContent = (
  assets: DocumentAssets,
  context: StaticHandlerContext,
  {
    development = false,
    clientContext,
    site,
  }: {
    development?: boolean;
    clientContext?: JsonValue;
    site: string;
  },
) => {
  const hydrationData: SerializableHydrationState = {
    loaderData: replacePromises(
      context.loaderData,
    ) as StaticHandlerContext['loaderData'],
    actionData: replacePromises(
      context.actionData,
    ) as StaticHandlerContext['actionData'],
    errors: serializeErrors(context.errors, { development }),
  };

  return [
    `window.__SKU_DOCUMENT_ASSETS__=${escapeScriptValue(assets)}`,
    // Preserve omitted/`undefined` vs intentional `null` (JSON.stringify(undefined) is unusable).
    `window.__SKU_CLIENT_CONTEXT__=${
      clientContext === undefined
        ? 'undefined'
        : escapeScriptValue(clientContext)
    }`,
    `window.__SKU_SITE__=${escapeScriptValue(site)}`,
    `window.__staticRouterHydrationData=${escapeScriptValue(hydrationData)}`,
  ].join(';');
};
