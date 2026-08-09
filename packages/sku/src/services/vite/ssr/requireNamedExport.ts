/**
 * Assert a SSR entry module exposes a required named export.
 * Missing values are a hard error (no soft-skip / sku noop).
 */
export const requireNamedExport = <T>(
  moduleExports: object,
  name: string,
  entryLabel: string,
  options?: { kind?: 'function' | 'defined' | 'routes' },
): T => {
  const value = (moduleExports as Record<string, unknown>)[name];
  const kind = options?.kind ?? 'defined';

  if (kind === 'function') {
    if (typeof value !== 'function') {
      throw new Error(
        `SSR ${entryLabel} must export named '${name}' as a function. Missing or invalid '${name}' export.`,
      );
    }
    return value as T;
  }

  if (kind === 'routes') {
    if (!Array.isArray(value)) {
      throw new Error(
        `SSR ${entryLabel} must export named '${name}' as an array. Missing or non-array '${name}' export.`,
      );
    }
    return value as T;
  }

  if (value === undefined) {
    throw new Error(
      `SSR ${entryLabel} must export named '${name}'. Missing or undefined '${name}' export.`,
    );
  }

  return value as T;
};

/**
 * SSR request entries `export default` one object (`defineServerEntry` /
 * `defineClientEntry`). Missing / non-object → hard error.
 */
export const requireDefaultEntry = <T extends object>(
  moduleExports: object,
  entryLabel: string,
): T => {
  const value = (moduleExports as { default?: unknown }).default;
  if (value === undefined || value === null || typeof value !== 'object') {
    throw new Error(
      `SSR ${entryLabel} must export default an object (via defineServerEntry / defineClientEntry). Missing or invalid default export.`,
    );
  }
  return value as T;
};

/**
 * Read an optional function property from a default-exported entry object.
 */
export const optionalEntryFunction = <T extends (...args: never[]) => unknown>(
  entry: object,
  name: string,
): T | undefined => {
  const value = (entry as Record<string, unknown>)[name];
  return typeof value === 'function' ? (value as T) : undefined;
};

/**
 * Optional when `required` is false; hard-error when true (property on the
 * default-exported entry object — e.g. `getSite` for multi-site).
 */
export const optionalOrRequiredEntryFunction = <
  T extends (...args: never[]) => unknown,
>(
  entry: object,
  name: string,
  entryLabel: string,
  required: boolean,
): T | undefined => {
  if (required) {
    const value = (entry as Record<string, unknown>)[name];
    if (typeof value !== 'function') {
      throw new Error(
        `SSR ${entryLabel} must include '${name}' as a function on its default export. Missing or invalid '${name}'.`,
      );
    }
    return value as T;
  }
  return optionalEntryFunction<T>(entry, name);
};

/**
 * Optional non-function property on a default-exported entry object
 * (e.g. `middleware`).
 */
export const optionalEntryValue = <T>(
  entry: object,
  name: string,
): T | undefined => {
  const value = (entry as Record<string, unknown>)[name];
  return value === undefined ? undefined : (value as T);
};
