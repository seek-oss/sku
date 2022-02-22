const debug = require('debug');

const routeMatcher = require('../lib/routeMatcher');
const { languages, sites } = require('../context');

const log = debug('sku:language-middleware');

function getValidLanguagesForRoute(route) {
  const routeIsForSpecificSite = typeof route.siteIndex === 'number';
  let languagesToRender = [null];
  if (languages) {
    if (route.languages) {
      languagesToRender = route.languages;
    } else if (routeIsForSpecificSite) {
      languagesToRender = sites[route.siteIndex].languages || languages;
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

function getLanguageParamFromUrl(pathname, route) {
  const match = routeMatcher(route)(pathname);

  return match ? match.params[LANGUAGE_NAMED_PARAM] : null;
}

function getLanguageFromRoute(req, route) {
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

function getRouteWithLanguage(routePath, language) {
  return routePath.replace(/(\$|\:)language/g, language);
}

module.exports = {
  getLanguageFromRoute,
  getRouteWithLanguage,
  getValidLanguagesForRoute,
};
