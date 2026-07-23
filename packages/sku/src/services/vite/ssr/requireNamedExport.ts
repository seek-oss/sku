/**
 * Assert a Vite SSR entry module exposes a required named export.
 * Missing values are a hard error (no soft-skip / sku noop).
 */
export const requireNamedExport = <T>(
  moduleExports: object,
  name: string,
  entryLabel: string,
  options?: { kind?: 'function' | 'defined' | 'array' },
): T => {
  const value = (moduleExports as Record<string, unknown>)[name];
  const kind = options?.kind ?? 'defined';

  if (kind === 'function') {
    if (typeof value !== 'function') {
      throw new Error(
        `Vite SSR ${entryLabel} must export named '${name}' as a function. Missing or invalid '${name}' export.`,
      );
    }
    return value as T;
  }

  if (kind === 'array') {
    if (!Array.isArray(value)) {
      throw new Error(
        `Vite SSR ${entryLabel} must export named '${name}' as an array. Missing or non-array '${name}' export.`,
      );
    }
    return value as T;
  }

  if (value === undefined) {
    throw new Error(
      `Vite SSR ${entryLabel} must export named '${name}'. Missing or undefined '${name}' export.`,
    );
  }

  return value as T;
};

/**
 * Optional Vite SSR entry export (e.g. dual-entry `getContext`).
 * Missing / non-function → `undefined` (default RR context behaviour).
 */
export const optionalNamedFunctionExport = <
  T extends (...args: never[]) => unknown,
>(
  moduleExports: object,
  name: string,
): T | undefined => {
  const value = (moduleExports as Record<string, unknown>)[name];
  return typeof value === 'function' ? (value as T) : undefined;
};
