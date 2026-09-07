import { ensurePnpmWorkspaceConfig } from '@sku-private/utils';

export const generatePnpmWorkspaceYaml = async (targetPath: string) => {
  await ensurePnpmWorkspaceConfig({
    targetDir: targetPath,
    create: true,
  });
};
