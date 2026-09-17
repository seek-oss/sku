import { Command } from 'commander';

export const workspaceCommand = new Command('workspace')
  .description(
    "Sync sku's recommended pnpm settings into the workspace root pnpm-workspace.yaml.",
  )
  .option(
    '--check',
    'Check the workspace root pnpm-workspace.yaml without writing changes.',
  )
  .action(async (options) => {
    const { workspaceAction } = await import('./workspace.action.js');
    await workspaceAction(options);
  });
