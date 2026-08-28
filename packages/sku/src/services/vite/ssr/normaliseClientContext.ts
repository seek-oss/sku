import type { JsonValue } from './types.js';

/**
 * JSON-compatible walk of `getClientContext` after it resolves.
 * Drops `undefined` object keys and coerces `undefined` array elements to `null`.
 * Top-level `undefined` stays JS `undefined` (not JSON `null`).
 *
 * Ensures the same value is passed to server functions as will appear in the client.
 */
export const normaliseClientContext = (
  clientContext: JsonValue | undefined,
): JsonValue | undefined => {
  if (clientContext === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(clientContext)) as JsonValue;
};
