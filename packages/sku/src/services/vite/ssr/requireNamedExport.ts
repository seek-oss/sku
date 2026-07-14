/**
 * Assert a Vite SSR entry module exposes a required named export.
 * Missing values are a hard error (no soft-skip / sku noop).
 */
export const requireNamedExport = <T>(
  moduleExports: object,
  name: string,
  entryLabel: string,
  options?: { kind?: 'function' | 'defined' },
): T => {
  const value = (moduleExports as Record<string, unknown>)[name];
  const kind = options?.kind ?? 'defined';
  const missing =
    kind === 'function' ? typeof value !== 'function' : value === undefined;

  if (missing) {
    throw new Error(
      kind === 'function'
        ? `Vite SSR ${entryLabel} must export named '${name}' as a function. Missing or invalid '${name}' export.`
        : `Vite SSR ${entryLabel} must export named '${name}'. Missing or undefined '${name}' export.`,
    );
  }

  return value as T;
};
