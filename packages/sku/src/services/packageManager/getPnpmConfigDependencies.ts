import { rootDir } from '@sku-private/utils';
import { execAsync } from '../../utils/execAsync.js';

export const getPnpmConfigDependencies = async (): Promise<string[]> => {
  // `pnpm config get configDependencies` returns `[object Object]` for some reason, so we fetch the
  // entire config as JSON and parse it instead.
  // See https://github.com/pnpm/pnpm/issues/9797
  //
  // Run from the workspace root rather than the current directory: pnpm 12 only reports the
  // `configDependencies` of the workspace project that contains the working directory, whereas
  // pnpm 11 walked up to the workspace root. Running from a nested directory that is not itself a
  // workspace project (e.g. a freshly scaffolded app inside a workspace) otherwise reports that
  // `pnpm-plugin-sku` is missing.
  const rawResult = await execAsync(`pnpm config get --json`, {
    cwd: rootDir ?? process.cwd(),
  });
  if (!rawResult) {
    return [];
  }

  // Be VERY careful with this object as it can contain package registry secrets.
  // Only extract specific keys that are safe to expose.
  // As of PNPM v11, sensitive information is now redacted.
  const result = JSON.parse(rawResult);

  // Keys changed to camel case in PNPM v11, so we check for both versions
  const configDependencies: Record<string, string> | undefined =
    result['config-dependencies'] ?? result.configDependencies;
  if (!configDependencies) {
    return [];
  }

  return Object.keys(configDependencies);
};
