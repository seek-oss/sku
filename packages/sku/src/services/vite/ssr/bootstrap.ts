import { isRouteErrorResponse, type StaticHandlerContext } from 'react-router';
import type {
  DocumentAssets,
  JsonValue,
  SerializableHydrationState,
} from './types.js';

const escapeScriptValue = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

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
      if (isRouteErrorResponse(error)) {
        return [
          key,
          {
            status: error.status,
            statusText: error.statusText,
            data: error.data,
          },
        ];
      }
      if (error instanceof Error) {
        return [
          key,
          {
            message: error.message,
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
    language,
  }: {
    development?: boolean;
    clientContext?: JsonValue;
    language?: string;
  } = {},
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
    `window.__SKU_CLIENT_CONTEXT__=${escapeScriptValue(clientContext ?? null)}`,
    `window.__SKU_LANGUAGE__=${escapeScriptValue(language ?? null)}`,
    `window.__staticRouterHydrationData=${escapeScriptValue(hydrationData)}`,
  ].join(';');
};
