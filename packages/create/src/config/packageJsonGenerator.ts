import type { TemplateConfig } from '../templates/templateConfigs.js';

interface PackageManagerInfo {
  name: string;
  version: string | null;
  rootDir: string | null;
}

export interface PackageJsonConfig {
  name: string;
  version: string;
  private: boolean;
  scripts: Record<string, string>;
  packageManager?: string;
  [key: string]: any;
}

function shouldIncludePackageManagerField(
  packageManagerInfo: PackageManagerInfo,
  projectDir: string,
): boolean {
  const isRepoRoot =
    packageManagerInfo.rootDir === null ||
    packageManagerInfo.rootDir === projectDir;

  return isRepoRoot && packageManagerInfo.version !== null;
}

export function generatePackageJson(
  projectName: string,
  templateConfig: TemplateConfig,
  packageManagerInfo: PackageManagerInfo,
  projectDir: string,
): PackageJsonConfig {
  const packageJson: PackageJsonConfig = {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: templateConfig.scripts,
    ...('packageJsonExtras' in templateConfig
      ? templateConfig.packageJsonExtras
      : {}),
  };

  if (shouldIncludePackageManagerField(packageManagerInfo, projectDir)) {
    packageJson.packageManager = `${packageManagerInfo.name}@${packageManagerInfo.version}`;
  }

  return packageJson;
}
