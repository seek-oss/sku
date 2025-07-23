import { execAsync } from '@/utils/execAsync.js';

export const getPnpmConfigDependencies = async (): Promise<string[]> => {
  const rawResult = await execAsync(`pnpm config get --json`);
  if (!rawResult) {
    return [];
  }

  // Be VERY careful with this object as it can contain package registry secrets.
  // Only extract specific keys that are safe to expose.
  const result = JSON.parse(rawResult);
  if (!result['config-dependencies']) {
    return [];
  }

  return Object.keys(result['config-dependencies']);
};
