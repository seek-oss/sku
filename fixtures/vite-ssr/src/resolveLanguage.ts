export const resolveLanguageFromPathname = (pathname: string): 'en' | 'fr' => {
  if (pathname === '/fr' || pathname.startsWith('/fr/')) {
    return 'fr';
  }

  return 'en';
};
