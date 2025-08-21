import type { SkuContext } from '../../../context/createSkuContext.js';

export const initAction = async (
  projectName: string,
  { verbose }: { verbose: boolean; skuContext: SkuContext },
) => {
  // Delegate to the create package for backward compatibility
  const { createProject } = await import('@sku-lib/create');

  return createProject(projectName, {
    template: 'webpack',
    verbose,
  });
};
