import { match } from 'path-to-regexp';

const routeMatcher = (route: string) => {
  const normalisedRoute = route
    .split('/')
    .map((part) => {
      if (part.startsWith('$')) {
        // Path is dynamic, map to ':id' style syntax supported by pathToRegexp
        return `:${part.slice(1)}`;
      }

      return part;
    })
    .join('/');

  return match(normalisedRoute);
};

export default routeMatcher;
