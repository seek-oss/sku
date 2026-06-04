import { execAsync } from '../../utils/execAsync.js';

export const getPnpmConfigDependencies = async (): Promise<string[]> => {
  // `pnpm config get configDependencies` returns `[object Object]` for some reason, so we fetch the
  // entire config as JSON and parse it instead.
  // See https://github.com/pnpm/pnpm/issues/9797
  const rawResult = await execAsync(`pnpm config get --json`);
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
