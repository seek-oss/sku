import path from 'node:path';
import { cwd } from '../../../../utils/cwd.js';

export const convertPathAliasesToWebpackAliases = (
  pathAliases?: Record<string, string>,
): Record<string, string> => {
  if (!pathAliases) return {};

  return Object.fromEntries(
    Object.entries(pathAliases).map(([alias, destination]) => {
      const baseAlias = alias.replace(/\/\*$/, '');
      const basePath = destination.replace(/\/\*$/, '');
      const resolvedPath = path.resolve(cwd(), basePath);
      return [baseAlias, resolvedPath];
    }),
  );
};
