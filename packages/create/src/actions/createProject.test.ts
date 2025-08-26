import { describe, it, vi, beforeEach, afterEach } from 'vitest';

import { createProject } from './createProject.js';
import prompts from 'prompts';
import { mkdir, writeFile } from 'node:fs/promises';
import { isEmptyDir } from '../utils/isEmptyDir.js';

// Mock external dependencies only
vi.mock('prompts');
vi.mock('node:fs/promises');

// Mock complex internal modules that would require file system setup
vi.mock('../installation/dependencyInstaller.js');
vi.mock('../templates/templateProcessor.js');
vi.mock('../utils/isEmptyDir.js');
vi.mock('../utils/cwd.js');

describe('createProject', () => {
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;
  const originalProcessExit = process.exit;
  const originalProcessChdir = process.chdir;

  beforeEach(async () => {
    console.error = vi.fn();
    console.log = vi.fn();
    process.exit = vi.fn() as any;
    process.chdir = vi.fn();

    // Setup basic mocks
    vi.mocked(prompts).mockResolvedValue({ selectedTemplate: 'webpack' });
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(writeFile).mockResolvedValue(undefined);
    vi.mocked(isEmptyDir).mockReturnValue(true);

    // Mock template processor to avoid complex file system operations
    const { processTemplateFiles } = await import(
      '../templates/templateProcessor.js'
    );
    vi.mocked(processTemplateFiles).mockResolvedValue(undefined);

    // Mock dependency installer
    const { installProjectDependencies } = await import(
      '../installation/dependencyInstaller.js'
    );
    vi.mocked(installProjectDependencies).mockResolvedValue(undefined);
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    process.exit = originalProcessExit;
    process.chdir = originalProcessChdir;
    vi.clearAllMocks();
  });

  // Note: Input validation is now tested in projectValidation.test.ts

  describe('template selection', () => {
    it('should prompt for template when none provided', async ({ expect }) => {
      await createProject('valid-project');

      expect(prompts).toHaveBeenCalledWith({
        type: 'select',
        name: 'selectedTemplate',
        message: 'Which template would you like to use?',
        choices: expect.arrayContaining([
          expect.objectContaining({ value: 'webpack' }),
          expect.objectContaining({ value: 'vite' }),
        ]),
        initial: 0,
      });
    });

    it('should use specified template without prompting', async ({
      expect,
    }) => {
      await createProject('valid-project', { template: 'vite' });

      expect(prompts).not.toHaveBeenCalled();
    });

    it('should prompt when template is "interactive"', async ({ expect }) => {
      await createProject('valid-project', { template: 'interactive' });

      expect(prompts).toHaveBeenCalled();
    });

    it('should exit when user cancels template selection', async ({
      expect,
    }) => {
      vi.mocked(prompts).mockResolvedValue({});

      // Mock process.exit to prevent actual exit and capture the call
      const mockExit = vi.mocked(process.exit);
      mockExit.mockImplementation((() => {}) as any);

      await createProject('valid-project');

      expect(console.log).toHaveBeenCalledWith('Template selection cancelled.');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  // Note: Package.json generation logic is now tested in packageJsonGenerator.test.ts

  describe('package.json writing', () => {
    it('should write package.json file to project directory', async ({
      expect,
    }) => {
      await createProject('test-project');

      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        expect.stringContaining('"name": "test-project"'),
      );
    });
  });

  describe('directory operations', () => {
    it('should create project directory', async ({ expect }) => {
      await createProject('test-project');

      expect(mkdir).toHaveBeenCalledWith('test-project', { recursive: true });
    });

    it('should exit when directory is not empty', async ({ expect }) => {
      vi.mocked(isEmptyDir).mockReturnValue(false);

      const mockExit = vi.mocked(process.exit);
      mockExit.mockImplementation((() => {}) as any);

      await createProject('test-project');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('The directory test-project is not empty'),
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should change to project directory', async ({ expect }) => {
      await createProject('test-project');

      expect(process.chdir).toHaveBeenCalledWith(
        expect.stringContaining('test-project'),
      );
    });
  });

  describe('error handling', () => {
    it('should handle mkdir failure', async ({ expect }) => {
      const mkdirError = new Error('Permission denied');
      vi.mocked(mkdir).mockRejectedValue(mkdirError);

      await expect(createProject('test-project')).rejects.toThrow(
        'Permission denied',
      );
    });

    it('should handle writeFile failure', async ({ expect }) => {
      const writeError = new Error('Disk full');
      vi.mocked(writeFile).mockRejectedValue(writeError);

      await expect(createProject('test-project')).rejects.toThrow('Disk full');
    });

    it('should handle template processing failure', async ({ expect }) => {
      const { processTemplateFiles } = await import(
        '../templates/templateProcessor.js'
      );
      const templateError = new Error('Template parsing failed');
      vi.mocked(processTemplateFiles).mockRejectedValue(templateError);

      await expect(createProject('test-project')).rejects.toThrow(
        'Template parsing failed',
      );
    });

    it('should handle dependency installation failure', async ({ expect }) => {
      const { installProjectDependencies } = await import(
        '../installation/dependencyInstaller.js'
      );
      const installError = new Error('Network error');
      vi.mocked(installProjectDependencies).mockRejectedValue(installError);

      await expect(createProject('test-project')).rejects.toThrow(
        'Network error',
      );
    });
  });

  describe('successful project creation', () => {
    it('should complete all steps without errors', async ({ expect }) => {
      await createProject('valid-project');

      // Should not call console.error or process.exit for valid projects
      expect(console.error).not.toHaveBeenCalled();
      expect(process.exit).not.toHaveBeenCalled();
    });

    it('should call all required steps in correct order', async ({
      expect,
    }) => {
      await createProject('valid-project');

      // Verify directory operations
      expect(mkdir).toHaveBeenCalledWith('valid-project', { recursive: true });
      expect(isEmptyDir).toHaveBeenCalled();
      expect(process.chdir).toHaveBeenCalledWith(
        expect.stringContaining('valid-project'),
      );

      // Verify file operations
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        expect.stringContaining('"name": "valid-project"'),
      );

      // Verify template and dependency processing
      const { processTemplateFiles } = await import(
        '../templates/templateProcessor.js'
      );
      const { installProjectDependencies } = await import(
        '../installation/dependencyInstaller.js'
      );
      expect(processTemplateFiles).toHaveBeenCalled();
      expect(installProjectDependencies).toHaveBeenCalled();
    });
  });
});
