import { execAsync } from '@/utils/execAsync.js';

type PnpmConfigKey = 'public-hoist-pattern' | 'only-built-dependencies';

export const getPnpmConfigValue = async (
  configKey: PnpmConfigKey,
): Promise<string[] | null> => {
  const rawResult = await execAsync(`pnpm config get ${configKey}`);
  const result = rawResult.trim();

  // There are various ways the result can be 'empty' or 'undefined'
  if (result === 'undefined' || result === '' || result === 'null') {
    return null;
  }

  // The output for our subset of keys should always be a comma-separated string
  const values = result.split(',').map((value) => value.trim());

  return values;
};
