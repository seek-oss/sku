import { existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { fdir as Fdir } from 'fdir';
import { Eta } from 'eta';
import { fileURLToPath } from 'node:url';
import dedent from 'dedent';
import {
  getInstallCommand,
  getPackageManagerInstallPage,
  getRunCommand,
  packageManager,
} from '@sku-private/utils';

import type { Template } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Base files incompatible with SSR (static render / #app hydrate). */
const BASE_FILES_SKIPPED_FOR_VITE_SSR = new Set([
  'src/render.tsx',
  'src/client.tsx',
  'src/types.ts',
  'src/App/App.tsx',
]);

/** Resolve `templates/` from dist (`../templates`) or src (`../../templates`). */
const resolveTemplatesRoot = (): string => {
  const candidates = [
    join(__dirname, '../templates'),
    join(__dirname, '../../templates'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(
      `Could not find @sku-lib/create templates directory (tried ${candidates.join(', ')})`,
    );
  }
  return found;
};

export interface TemplateOptions {
  projectName: string;
  template: Template;
}

interface TemplateData {
  projectName: string;
  appName: string;
  gettingStartedDocs: string;
  startScript: string;
  buildScript: string;
  testScript: string;
  formatScript: string;
  lintScript: string;
}

export const generateTemplateFiles = async (
  targetPath: string,
  { projectName, template }: TemplateOptions,
) => {
  const templatesRoot = resolveTemplatesRoot();
  const baseTemplateDir = join(templatesRoot, 'base');
  const bundlerTemplateDir = join(templatesRoot, template);

  const templateData = createTemplateData(projectName);

  await copyTemplateFiles(baseTemplateDir, targetPath, templateData, {
    skipRelativePaths:
      template === 'vite-ssr' ? BASE_FILES_SKIPPED_FOR_VITE_SSR : undefined,
  });
  await copyTemplateFiles(bundlerTemplateDir, targetPath, templateData);
};

export const createTemplateData = (projectName: string): TemplateData => {
  const startScript = `${getRunCommand('start')}`;
  const buildScript = `${getRunCommand('build')}`;
  const testScript = getRunCommand('test');
  const formatScript = getRunCommand('format');
  const lintScript = getRunCommand('lint');

  return {
    projectName,
    appName: projectName,
    gettingStartedDocs: dedent`
    First of all, make sure you've installed [${packageManager}](${getPackageManagerInstallPage()}).

    Then, install dependencies:

    \`\`\`sh
    $ ${getInstallCommand()}
    \`\`\`
    `,
    startScript,
    buildScript,
    testScript,
    formatScript,
    lintScript,
  };
};

const copyTemplateFiles = async (
  templateDir: string,
  targetPath: string,
  templateData: TemplateData,
  options?: { skipRelativePaths?: Set<string> },
) => {
  const templateFiles = await new Fdir()
    .withBasePath()
    .crawl(templateDir)
    .withPromise();

  const eta = new Eta({
    views: templateDir,
    varName: 'data',
    defaultExtension: '',
    autoTrim: false,
  });

  await Promise.all(
    templateFiles.map(async (file) => {
      try {
        const relativePath = relative(templateDir, file);
        if (options?.skipRelativePaths?.has(relativePath)) {
          return;
        }

        const destinationPath = join(
          targetPath,
          normalizeFileName(relativePath),
        );

        const destDir = dirname(destinationPath);
        await mkdir(destDir, { recursive: true });

        const processedContent = await eta.renderAsync(
          relativePath,
          templateData,
        );

        await writeFile(destinationPath, processedContent, 'utf8');
      } catch (error) {
        throw new Error(
          `Failed to process template file ${file}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }),
  );
};

export const normalizeFileName = (filePath: string): string => {
  // Handle files that start with underscore (like _.gitignore -> .gitignore)
  const parts = filePath.split('/');
  const fileName = parts[parts.length - 1];

  if (fileName.startsWith('_')) {
    const normalizedFileName = fileName.replace(/^_/, '.');
    parts[parts.length - 1] = normalizedFileName;
    return parts.join('/');
  }

  return filePath;
};
