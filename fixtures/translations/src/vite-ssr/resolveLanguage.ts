/** Match webpack SSR: path language, or `en-PSEUDO` when `?pseudo` is present. */
export const resolveLanguage = (pathname: string, search: string): string => {
  const isPseudo = Boolean(new URLSearchParams(search).get('pseudo'));
  const pathLanguage = pathname.includes('fr') ? 'fr' : 'en';
  return isPseudo ? 'en-PSEUDO' : pathLanguage;
};
