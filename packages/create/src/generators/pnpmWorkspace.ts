import { syncPnpmWorkspaceConfig } from '@sku-private/utils/pnpm-workspace';

export const generatePnpmWorkspaceYaml = async (targetPath: string) => {
  await syncPnpmWorkspaceConfig({
    targetDir: targetPath,
    create: true,
  });
};
