import { syncPnpmWorkspaceConfig } from '@sku-private/utils';

export const generatePnpmWorkspaceYaml = async (targetPath: string) => {
  await syncPnpmWorkspaceConfig({
    targetDir: targetPath,
    create: true,
  });
};
