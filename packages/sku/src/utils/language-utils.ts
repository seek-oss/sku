import debug from 'debug';

import routeMatcher from './routeMatcher.js';
import type { SkuLanguage } from '#src/types/types.js';
import type {
  SkuContext,
  NormalizedRoute,
} from '#src/context/createSkuContext.js';

const log = debug('sku:language-middleware');

export function getValidLanguagesForRoute({
  route,
  languages,
  sites,
}: {
  route: NormalizedRoute;
  languages: SkuContext['languages'];
  sites: SkuContext['sites'];
}) {
  const routeIsForSpecificSite = typeof route.siteIndex === 'number';

  let languagesToRender: Array<SkuLanguage | null> = [null];
  if (languages) {
    if (route.languages) {
      languagesToRender = route.languages.slice();
    } else if (routeIsForSpecificSite) {
      languagesToRender =
        sites[route.siteIndex ?? 0].languages?.slice() || languages;
    } else {
      languagesToRender = languages;
    }
  }

  const languageNames = languagesToRender.map((lang) =>
    lang && typeof lang !== 'string' ? lang.name : lang,
  );
  log(
    `Using languages ${languageNames.join(', ')} for route:`,
    route.name || route.route,
  );
  return languageNames;
}

const LANGUAGE_NAMED_PARAM = 'language';

function getLanguageParamFromUrl(pathname: string, route: string) {
  const match = routeMatcher(route)(pathname);

  return match ? match.params[LANGUAGE_NAMED_PARAM] : null;
}

export function getLanguageFromRoute(
  path: string,
  route: NormalizedRoute,
  skuConfig: SkuContext,
) {
  const supportedLanguagesForRoute = getValidLanguagesForRoute({
    route,
    languages: skuConfig.languages,
    sites: skuConfig.sites,
  });

  log('Looking for language in requested path', {
    path,
    route: route.route,
  });
  const requestedLanguageByRoute = getLanguageParamFromUrl(path, route.route);
  if (requestedLanguageByRoute) {
    if (supportedLanguagesForRoute.includes(requestedLanguageByRoute)) {
      log(`Returning language from URL "${requestedLanguageByRoute}"`);
      return requestedLanguageByRoute;
    }

    log('Invalid language requested', {
      supportedLanguagesForRoute,
      requestedLanguageByRoute,
    });
    throw new Error(
      `Invalid language requested. Request: ${
        path
      } Possible languages: ${supportedLanguagesForRoute.join(
        ', ',
      )} Language detected: ${requestedLanguageByRoute}`,
    );
  }

  if (supportedLanguagesForRoute.length > 1) {
    log('Unable to find language in route that supports multiple languages', {
      supportedLanguagesForRoute,
      path,
      route,
    });
    throw new Error(
      `Unable to find language in route that supports multiple languages. Request: ${
        path
      } Possible languages: ${supportedLanguagesForRoute.join(', ')}
      Did you forget to put "$language" in your route?`,
    );
  }

  log(
    `Returning only valid language for URL: ${path} Language: ${supportedLanguagesForRoute[0]}`,
  );
  return supportedLanguagesForRoute[0];
}

export function getRouteWithLanguage(
  routePath: string,
  language: string | null,
) {
  return routePath.replace(/(\$|\:)language/g, language || '');
}
