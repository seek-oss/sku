import { describe, it, beforeEach, afterEach, vi } from 'vitest';
import {
  getPackageManagerFromUserAgent,
  getRunCommand,
  getInstallCommand,
  isAtLeastPnpmV10,
  supportedPackageManagers,
} from './packageManager.js';

describe('packageManager', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getPackageManagerFromUserAgent', () => {
    it('should default to pnpm when no user agent is set', ({ expect }) => {
      delete process.env.npm_config_user_agent;

      const result = getPackageManagerFromUserAgent();

      expect(result.packageManager).toBe('pnpm');
      expect(result.version).toBeNull();
    });

    describe.each([
      {
        name: 'npm',
        userAgent: 'npm/8.19.2 node/v18.12.1 linux x64 workspaces/false',
        expectedPM: 'npm',
        expectedVersion: '8.19.2',
      },
      {
        name: 'yarn',
        userAgent: 'yarn/1.22.19 npm/? node/v18.12.1 linux x64',
        expectedPM: 'yarn',
        expectedVersion: '1.22.19',
      },
      {
        name: 'pnpm',
        userAgent: 'pnpm/7.12.2 npm/? node/v18.12.1 linux x64',
        expectedPM: 'pnpm',
        expectedVersion: '7.12.2',
      },
      {
        name: 'pnpm when multiple package managers mentioned',
        userAgent: 'pnpm/8.0.0 npm/9.0.0 node/v18.12.1',
        expectedPM: 'pnpm',
        expectedVersion: '8.0.0',
      },
    ])(
      'detecting $name from user agent',
      ({ userAgent, expectedPM, expectedVersion }) => {
        it('should detect correct package manager and version', ({
          expect,
        }) => {
          process.env.npm_config_user_agent = userAgent;

          const result = getPackageManagerFromUserAgent();

          expect(supportedPackageManagers).toContain(result.packageManager);
          expect(result.packageManager).toBe(expectedPM);
          expect(result.version).toBe(expectedVersion);
        });
      },
    );

    it('should handle malformed user agent gracefully and fallback to pnpm', ({
      expect,
    }) => {
      process.env.npm_config_user_agent = 'invalid/format';

      const result = getPackageManagerFromUserAgent();

      expect(result.packageManager).toBe('pnpm');
    });
  });

  describe('getRunCommand', () => {
    it('should generate correct npm run command', ({ expect }) => {
      expect(getRunCommand('start')).toContain('start');
      expect(getRunCommand('build')).toContain('build');
    });

    it('should handle different script names', ({ expect }) => {
      const startCommand = getRunCommand('start');
      const buildCommand = getRunCommand('build');
      const testCommand = getRunCommand('test');

      expect(startCommand).toMatch(/(npm run|yarn|pnpm run) start/);
      expect(buildCommand).toMatch(/(npm run|yarn|pnpm run) build/);
      expect(testCommand).toMatch(/(npm run|yarn|pnpm run) test/);
    });
  });

  describe('getInstallCommand', () => {
    it('should generate install command for current package manager', ({
      expect,
    }) => {
      const command = getInstallCommand();

      expect(command).toMatch(/^(npm install|yarn|pnpm install)$/);
    });
  });

  describe('isAtLeastPnpmV10', () => {
    it('should return boolean value', ({ expect }) => {
      const result = isAtLeastPnpmV10();
      expect(typeof result).toBe('boolean');
    });
  });
});
