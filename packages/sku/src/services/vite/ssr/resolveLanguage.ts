/**
 * Resolve the active language for Vite SSR vocab chunk registration.
 * Prefers the server request entry `language`, then the sole configured
 * language when only one is set. Soft-fails (returns `undefined`) when
 * unresolved. Does not use `:language` route params.
 */
export const resolveRequestLanguage = ({
  languages,
  requestLanguage,
}: {
  languages: string[];
  /** From the server request entry (configured language name). */
  requestLanguage?: string;
}): string | undefined => {
  if (languages.length === 0) {
    return undefined;
  }

  const allowed = new Set([...languages, 'en-PSEUDO']);

  // Explicit server-entry language: valid → use it; unknown → soft-fail (no sole-language fallback).
  if (requestLanguage) {
    return allowed.has(requestLanguage) ? requestLanguage : undefined;
  }

  if (languages.length === 1) {
    return languages[0];
  }

  return undefined;
};
