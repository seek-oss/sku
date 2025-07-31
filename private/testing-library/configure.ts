import { TEST_TIMEOUT } from '@sku-private/test-utils/constants';
import { configure as _configure, type Config } from 'cli-testing-library';

// Default configuration for cli-testing-library
const DEFAULT_CONFIG: Partial<Config> = {
  asyncUtilTimeout: TEST_TIMEOUT,
};

// Configure cli-testing-library with default settings
export const configure = () => _configure(DEFAULT_CONFIG);
