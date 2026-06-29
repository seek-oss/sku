import { describe, it, vi, expect, beforeEach } from 'vitest';

import {
  isCjsSkuConfig,
  validateSkuConfigFormat,
} from './validateSkuConfigFormat.js';

const { readFileSync } = vi.hoisted(() => ({ readFileSync: vi.fn() }));

vi.mock('node:fs', () => ({ readFileSync }));

describe('isCjsSkuConfig', () => {
  it('should detect a `module.exports` config', () => {
    expect(
      isCjsSkuConfig(`module.exports = { clientEntry: 'src/client.tsx' };`),
    ).toBe(true);
  });

  it('should detect a `module.exports` config with leading whitespace', () => {
    expect(isCjsSkuConfig(`  module.exports = {};`)).toBe(true);
  });

  it('should detect a `module.exports.foo` config', () => {
    expect(
      isCjsSkuConfig(`module.exports.clientEntry = 'src/client.tsx';`),
    ).toBe(true);
  });

  it('should detect `module.exports` after imports and variable declarations', () => {
    expect(
      isCjsSkuConfig(`const { join } = require('node:path');
const clientEntry = join('src', 'client.tsx');

module.exports = { clientEntry };`),
    ).toBe(true);
  });

  it('should not flag an ESM `export default` config', () => {
    expect(
      isCjsSkuConfig(`export default { clientEntry: 'src/client.tsx' };`),
    ).toBe(false);
  });
});

describe('validateSkuConfigFormat', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // `process.exit` is typed to return `never`, so throw to model that the
    // process would stop here and to halt execution in the test.
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit: ${code}`);
    });
    logSpy = vi.spyOn(globalThis.console, 'log').mockImplementation(() => {});
  });

  it('should do nothing when there is no config path', () => {
    validateSkuConfigFormat();

    expect(readFileSync).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('should not exit for an ESM config', () => {
    readFileSync.mockReturnValue(
      `export default { clientEntry: 'src/client.tsx' };`,
    );

    validateSkuConfigFormat('/app/sku.config.ts');

    expect(exitSpy).not.toHaveBeenCalled();
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should show a banner and exit for a CJS config', () => {
    readFileSync.mockReturnValue(
      `module.exports = { clientEntry: 'src/client.tsx' };`,
    );

    expect(() => validateSkuConfigFormat('/app/sku.config.js')).toThrow(
      'process.exit: 1',
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.mock.calls.join('\n')).toContain(
      'Unsupported sku config format',
    );
  });
});
