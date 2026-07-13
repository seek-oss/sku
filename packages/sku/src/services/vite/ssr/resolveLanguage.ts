type RouteMatch = {
  params: Record<string, string | undefined>;
  route: { handle?: unknown };
};

/**
 * Resolve the active language for Vite SSR vocab chunk registration.
 * Prefers the request language slot, then a `language` route param, then the
 * sole configured language when only one is configured. Soft-fails (returns
 * `undefined`) when unresolved.
 */
export const resolveRequestLanguage = ({
  matches,
  languages,
  requestLanguage,
}: {
  matches: RouteMatch[];
  languages: string[];
  /** App-owned request slot (e.g. `req.skuLanguage`). */
  requestLanguage?: string;
}): string | undefined => {
  if (languages.length === 0) {
    return undefined;
  }

  const allowed = new Set([...languages, 'en-PSEUDO']);

  // Explicit request slot wins: valid → use it; unknown → soft-fail (no heuristic fallback).
  if (requestLanguage) {
    return allowed.has(requestLanguage) ? requestLanguage : undefined;
  }

  for (const { params } of matches) {
    if (params.language && allowed.has(params.language)) {
      return params.language;
    }
  }

  if (languages.length === 1) {
    return languages[0];
  }

  return undefined;
};
