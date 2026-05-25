import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Document } from 'yaml';

export const generatePnpmWorkspaceYaml = async (targetPath: string) => {
  const { defaultConfig: pnpmWorkspaceYamlConfig } =
    await import('pnpm-plugin-sku/config');

  const doc = new Document(pnpmWorkspaceYamlConfig);

  // @ts-expect-error `getIn` returns type `unknown`
  doc.getIn(['trustPolicyExclude', 0], true).comment =
    ' dependency of eslint-plugin-react';
  // @ts-expect-error `get` returns type `unknown`
  doc.get('minimumReleaseAge', true).comment = ' 3 days';

  const pnpmWorkspaceYamlPath = join(targetPath, 'pnpm-workspace.yaml');
  const pnpmWorkspaceYamlContents = doc.toString();

  await writeFile(pnpmWorkspaceYamlPath, pnpmWorkspaceYamlContents, 'utf8');
};
