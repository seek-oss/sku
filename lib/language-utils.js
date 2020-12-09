const debug = require('debug');
const cookie = require('cookie');

const routeMatcher = require('../lib/routeMatcher');
const { languages, sites } = require('../context');

const log = debug('sku:language-middleware');

function getLanguagesToRender(route) {
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
    typeof lang === 'string' ? lang : lang.name,
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

function getLangugeFromCookie(req) {
  return req.headers.cookie
    ? cookie.parse(req.headers.cookie)['override-language']
    : null;
}

function getLanguageFromRoute(req, route) {
  log('Looking for language in URL', req.url);
  const requestedLanguageByRoute = getLanguageParamFromUrl(
    req.url,
    route.route,
  );
  if (requestedLanguageByRoute) {
    log(`Returning language from URL "${requestedLanguageByRoute}"`);
    return requestedLanguageByRoute;
  }

  const requestedLanguageByCookie = getLangugeFromCookie(req);
  if (requestedLanguageByCookie) {
    log(`Returning language from Cookie "${requestedLanguageByCookie}"`);
    return requestedLanguageByCookie;
  }

  const supportedLanguagesForRoute = getLanguagesToRender(route);
  const requestedLanguageByHeader = req.acceptsLanguages(
    supportedLanguagesForRoute,
  );
  log(
    'Looking for language in header with supported langauges:',
    supportedLanguagesForRoute,
  );
  if (requestedLanguageByHeader) {
    log(`Returning language from header "${requestedLanguageByHeader}"`);
    return requestedLanguageByHeader;
  }

  return 'en';
}

module.exports = { getLanguageFromRoute, getLanguagesToRender };
