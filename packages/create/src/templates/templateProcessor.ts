import { mkdir, writeFile } from 'node:fs/promises';
import { posix as path } from 'node:path';
import dedent from 'dedent';
import { fdir as Fdir } from 'fdir';
import { Eta } from 'eta';

import {
  getRunCommand,
  getPackageManagerInstallPage,
  getInstallCommand,
} from '../utils/packageManager.js';
import { toPosixPath } from '../utils/toPosixPath.js';

const removeLeadingUnderscoreFromFileName = (filePath: string) => {
  const basename = path.basename(filePath);

  if (basename.startsWith('_')) {
    const normalizedFileName = basename.replace(/^_/, '');
    const dirname = path.dirname(filePath);

    return path.join(dirname, normalizedFileName);
  }

  return filePath;
};

const getTemplateFileDestinationFromRoot =
  (projectRoot: string, templateDirectory: string) => (filePath: string) => {
    const normalizedFilePath = removeLeadingUnderscoreFromFileName(filePath);
    const filePathRelativeToTemplate =
      normalizedFilePath.split(templateDirectory)[1];

    return path.join(projectRoot, filePathRelativeToTemplate);
  };

interface TemplateData {
  appName: string;
  gettingStartedDocs: string;
  startScript: string;
  testScript: string;
  lintScript: string;
  formatScript: string;
  buildScript: string;
}

function generateTemplateData(appName: string): TemplateData {
  return {
    appName,
    gettingStartedDocs: dedent`
      First of all, make sure you've installed [pnpm](${getPackageManagerInstallPage()}).

      Then, install dependencies:

      \`\`\`sh
      $ ${getInstallCommand()}
      \`\`\`
    `,
    startScript: getRunCommand('start'),
    testScript: getRunCommand('test'),
    lintScript: getRunCommand('lint'),
    formatScript: getRunCommand('format'),
    buildScript: getRunCommand('build'),
  };
}

export async function processTemplateFiles(
  selectedTemplate: string,
  projectDir: string,
  appName: string,
): Promise<void> {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);

  const templateDirectory = path.join(
    toPosixPath(__dirname),
    `../../templates/${selectedTemplate}`,
  );

  const templateFiles = await new Fdir()
    .withBasePath()
    .crawl(templateDirectory)
    .withPromise();

  const getTemplateFileDestination = getTemplateFileDestinationFromRoot(
    projectDir,
    templateDirectory,
  );

  const templateData = generateTemplateData(appName);

  const eta = new Eta({
    views: templateDirectory,
    varName: 'data',
    defaultExtension: '',
    autoTrim: false,
  });

  await Promise.all(
    templateFiles.map(async (file) => {
      const fileContents = await eta.renderAsync(
        path.relative(templateDirectory, file),
        templateData,
      );

      const destination = getTemplateFileDestination(file);

      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, fileContents);
    }),
  );
}

// Export utility functions for testing
export {
  removeLeadingUnderscoreFromFileName,
  getTemplateFileDestinationFromRoot,
};
