import { join, dirname, relative } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { fdir as Fdir } from 'fdir';
import { Eta } from 'eta';
import { fileURLToPath } from 'node:url';

import type { Template } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  console.log('📋 Copying template files...');

  const templatesRoot = join(__dirname, '../../templates');
  const baseTemplateDir = join(templatesRoot, 'base');
  const bundlerTemplateDir = join(templatesRoot, template);

  const templateData = createTemplateData(projectName, template);

  await copyTemplateFiles(baseTemplateDir, targetPath, templateData);
  await copyTemplateFiles(bundlerTemplateDir, targetPath, templateData);

  console.log('✅ Template files copied');
};

const createTemplateData = (
  projectName: string,
  template: Template,
): TemplateData => {
  const isVite = template === 'vite';
  const bundlerFlag = isVite ? ' --experimental-bundler' : '';

  return {
    projectName,
    appName: projectName,
    gettingStartedDocs: `To start developing, run \`${
      isVite ? 'npm start --experimental-bundler' : 'npm start'
    }\` and open your browser to the URL provided in the terminal.`,
    startScript: `npm start${bundlerFlag}`,
    buildScript: `npm run build${bundlerFlag}`,
    testScript: 'npm test',
    formatScript: 'npm run format',
    lintScript: 'npm run lint',
  };
};

const copyTemplateFiles = async (
  templateDir: string,
  targetPath: string,
  templateData: TemplateData,
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
      const relativePath = relative(templateDir, file);
      const destinationPath = join(targetPath, normalizeFileName(relativePath));

      const destDir = dirname(destinationPath);
      await mkdir(destDir, { recursive: true });

      const processedContent = await eta.renderAsync(
        relativePath,
        templateData,
      );

      await writeFile(destinationPath, processedContent, 'utf8');
    }),
  );
};

const normalizeFileName = (filePath: string): string => {
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
