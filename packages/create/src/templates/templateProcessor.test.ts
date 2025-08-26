import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import {
  processTemplateFiles,
  removeLeadingUnderscoreFromFileName,
  getTemplateFileDestinationFromRoot,
} from './templateProcessor.js';

// Mock dependencies
vi.mock('node:fs/promises');
vi.mock('fdir');
vi.mock('eta');
vi.mock('../utils/packageManager.js');
vi.mock('../utils/toPosixPath.js');

import { mkdir, writeFile } from 'node:fs/promises';
import { fdir as Fdir } from 'fdir';
import { Eta } from 'eta';
import {
  getRunCommand,
  getPackageManagerInstallPage,
  getInstallCommand,
} from '../utils/packageManager.js';
import { toPosixPath } from '../utils/toPosixPath.js';

describe('templateProcessor', () => {
  beforeEach(() => {
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(getRunCommand).mockImplementation(
      (script) => `pnpm run ${script}`,
    );
    vi.mocked(getInstallCommand).mockReturnValue('pnpm install');
    vi.mocked(getPackageManagerInstallPage).mockReturnValue(
      'https://pnpm.io/installation',
    );
    vi.mocked(toPosixPath).mockImplementation((path) => path);

    // Mock fdir chain - return empty array to avoid path resolution issues
    const mockFdirInstance = {
      withBasePath: vi.fn().mockReturnThis(),
      crawl: vi.fn().mockReturnThis(),
      withPromise: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(Fdir).mockImplementation(() => mockFdirInstance as any);

    // Mock Eta
    const mockEtaInstance = {
      renderAsync: vi.fn().mockResolvedValue('mock rendered content'),
    };
    vi.mocked(Eta).mockImplementation(() => mockEtaInstance as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('removeLeadingUnderscoreFromFileName', () => {
    it('should remove leading underscore from filename', ({ expect }) => {
      const result = removeLeadingUnderscoreFromFileName('/path/to/_gitignore');
      expect(result).toBe('/path/to/gitignore');
    });

    it('should not modify filename without leading underscore', ({
      expect,
    }) => {
      const result = removeLeadingUnderscoreFromFileName(
        '/path/to/normal-file.txt',
      );
      expect(result).toBe('/path/to/normal-file.txt');
    });

    it('should only remove first underscore', ({ expect }) => {
      const result = removeLeadingUnderscoreFromFileName(
        '/path/to/_file_with_underscores.txt',
      );
      expect(result).toBe('/path/to/file_with_underscores.txt');
    });
  });

  describe('getTemplateFileDestinationFromRoot', () => {
    it('should map template file to project destination', ({ expect }) => {
      const getDestination = getTemplateFileDestinationFromRoot(
        '/project/root',
        '/templates/webpack',
      );

      const result = getDestination('/templates/webpack/src/index.tsx');
      expect(result).toBe('/project/root/src/index.tsx');
    });

    it('should handle underscore-prefixed files', ({ expect }) => {
      const getDestination = getTemplateFileDestinationFromRoot(
        '/project/root',
        '/templates/webpack',
      );

      const result = getDestination('/templates/webpack/_gitignore');
      expect(result).toBe('/project/root/gitignore');
    });

    it('should handle nested paths', ({ expect }) => {
      const getDestination = getTemplateFileDestinationFromRoot(
        '/project/root',
        '/templates/webpack',
      );

      const result = getDestination(
        '/templates/webpack/src/components/Button.tsx',
      );
      expect(result).toBe('/project/root/src/components/Button.tsx');
    });
  });

  describe('processTemplateFiles', () => {
    it('should setup template processing correctly', async ({ expect }) => {
      await processTemplateFiles('webpack', '/project/dir', 'my-app');

      // Should call fdir to get template files
      expect(Fdir).toHaveBeenCalled();

      // Should call Eta to render templates
      expect(Eta).toHaveBeenCalledWith({
        views: expect.stringContaining('templates/webpack'),
        varName: 'data',
        defaultExtension: '',
        autoTrim: false,
      });
    });

    it('should complete successfully with empty template files', async ({
      expect,
    }) => {
      // With empty file array, should complete without errors
      await expect(
        processTemplateFiles('webpack', '/project/dir', 'my-app'),
      ).resolves.not.toThrow();
    });
  });
});
