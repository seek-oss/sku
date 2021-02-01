const debug = require('debug');

const routeMatcher = require('../lib/routeMatcher');
const { languages, sites } = require('../context');

const log = debug('sku:language-middleware');

function getValidLanguagesForRoute(route) {
  const routeIsForSpecificSite = typeof route.siteIndex === 'number';
  let languagesToRender = [null];
  if (languages) {
    if (routeIsForSpecificSite) {
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

function getLanguageParamFromUrl(url, route) {
  const match = routeMatcher(route)(url);

  return match ? match.params[LANGUAGE_NAMED_PARAM] : null;
}

function getLanguageFromRoute(req, route) {
  const supportedLanguagesForRoute = getValidLanguagesForRoute(route);

  log('Looking for language in URL', req.url);
  const requestedLanguageByRoute = getLanguageParamFromUrl(
    req.url,
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

function getRouteWithLanguage(req, route) {
  const language = getLanguageFromRoute(req, route);
  return {
    language,
    route: route.replace('$language', language),
  };
}

module.exports = { getRouteWithLanguage, getValidLanguagesForRoute };
