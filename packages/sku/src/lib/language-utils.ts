import debug from 'debug';
import type { Request } from 'express';

import routeMatcher from './routeMatcher.js';
import { languages, sites, type NormalizedRoute } from '../context/index.js';
import type { SkuLanguage } from '../../sku-types.js';

const log = debug('sku:language-middleware');

export function getValidLanguagesForRoute(route: NormalizedRoute) {
  const routeIsForSpecificSite = typeof route.siteIndex === 'number';

  let languagesToRender: Array<SkuLanguage | null> = [null];
  if (languages) {
    if (route.languages) {
      // Escaping readonly here. I don't know the best solution here.
      languagesToRender = route.languages as SkuLanguage[];
    } else if (routeIsForSpecificSite) {
      if (route.siteIndex) {
        languagesToRender =
          (sites[route.siteIndex].languages as SkuLanguage[]) || languages;
      }
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

function getLanguageParamFromUrl(pathname: string, route: any) {
  const match = routeMatcher(route)(pathname);

  return match
    ? (match.params as Record<string, any>)[LANGUAGE_NAMED_PARAM]
    : null;
}

export function getLanguageFromRoute(req: Request, route: NormalizedRoute) {
  const supportedLanguagesForRoute = getValidLanguagesForRoute(route);

  log('Looking for language in requested path', {
    url: req.url,
    path: req.path,
    route: route.route,
  });
  const requestedLanguageByRoute = getLanguageParamFromUrl(
    req.path,
    route.route,
  );
  if (requestedLanguageByRoute) {
    if (supportedLanguagesForRoute.includes(requestedLanguageByRoute)) {
      log(`Returning language from URL "${requestedLanguageByRoute}"`);
      return requestedLanguageByRoute;
    }

    log('Invalid language requested', {
      supportedLanguagesForRoute,
      url: req.url,
      requestedLanguageByRoute,
    });
    throw new Error(
      `Invalid language requested. Request: ${
        req.url
      } Possible languages: ${supportedLanguagesForRoute.join(
        ', ',
      )} Language detected: ${requestedLanguageByRoute}`,
    );
  }

  if (supportedLanguagesForRoute.length > 1) {
    log('Unable to find language in route that supports multiple languages', {
      supportedLanguagesForRoute,
      url: req.url,
      route,
    });
    throw new Error(
      `Unable to find language in route that supports multiple languages. Request: ${
        req.url
      } Possible languages: ${supportedLanguagesForRoute.join(', ')}
      Did you forget to put "$language" in your route?`,
    );
  }

  log(
    `Returning only valid language for URL: ${req.url} Language: ${supportedLanguagesForRoute[0]}`,
  );
  return supportedLanguagesForRoute[0];
}

export function getRouteWithLanguage(
  routePath: string,
  language: string | null,
) {
  return routePath.replace(/(\$|\:)language/g, language || '');
}
