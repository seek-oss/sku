import { major } from 'semver';

/**
 * We only really care about the major version of the package manager version field.
 * This functino replaces the minor and patch version of the package manager version
 * with `VERSION_IGNORED`.
 */
export const normalizePackageManagerVersion = (packageManager: string) => {
  const [name, version] = packageManager.split('@');
  const packageManagerMajorVersion = major(version);
  return `${name}@${packageManagerMajorVersion}.VERSION_IGNORED`;
};
