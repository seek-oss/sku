import { intersects } from 'semver';
import { execSync } from 'node:child_process';
import debug from 'debug';

const log = debug('sku:cjsInteropDependencies');

type CjsInteropDependencies = {
  serveCjsInteropDependencies: string[];
  buildCjsInteropDependencies: string[];
};

export const getCjsInteropDeps = ({
  appName,
  cjsInteropDependencies,
  apolloClientVersion,
}: {
  appName: string | null;
  cjsInteropDependencies: string[];
  apolloClientVersion: string | null;
}): CjsInteropDependencies => {
  let resolvedApolloClientVersion: string | null = apolloClientVersion;

  try {
    if (resolvedApolloClientVersion?.startsWith('catalog')) {
      // Assume we have a PNPM catalog dependency

      if (!appName) {
        // We can't accurately determine whether or not to include @apollo/client in this case
        throw new Error('Failed to find app name');
      }

      resolvedApolloClientVersion = getApolloClientVersionForPnpmApp(appName);
    }

    if (!resolvedApolloClientVersion) {
      throw new Error(
        `Could not resolve apollo client version in app ${appName}`,
      );
    }

    const dependsOnApolloClientV3 =
      resolvedApolloClientVersion &&
      intersects(resolvedApolloClientVersion, '^3');

    const serveCjsInteropDependencies = [...cjsInteropDependencies];
    if (dependsOnApolloClientV3) {
      serveCjsInteropDependencies.push(
        '@apollo/client',
        '@apollo/client/react',
      );
    }

    // Vite build seems to resolve `@apollo/client/react` correctly - applying CJS interop to it
    // results in build errors
    const buildCjsInteropDependencies = serveCjsInteropDependencies.filter(
      (dep) => !dep.startsWith('@apollo/client/react'),
    );

    return { serveCjsInteropDependencies, buildCjsInteropDependencies };
  } catch (e) {
    if (e instanceof Error) {
      log(e.message);
    }

    // Fall back to the previous behaviour of always including `@apollo/client`
    return {
      serveCjsInteropDependencies: [
        ...cjsInteropDependencies,
        '@apollo/client',
      ],
      buildCjsInteropDependencies: [
        ...cjsInteropDependencies,
        '@apollo/client',
      ],
    };
  }
};

const getApolloClientVersionForPnpmApp = (appName: string): string | null => {
  // Output looks like:
  // @sku-fixtures/vite-cjs-interop-apollo-client-v4 > @apollo/client@4.1.6
  // There may be multiple lines if app deps have peer deps on apollo client
  const pnpmWhyResults = pnpmWhy({
    packageName: '@apollo/client',
    appName,
  }).split('\n');

  // Only one line should start with the app name
  const appResult = pnpmWhyResults.find((result) => result.startsWith(appName));

  if (!appResult) {
    return null;
  }

  const version = appResult.match(/@apollo\/client@(?<version>\d+\.\d+\.\d+)/)
    ?.groups?.version;

  return version || null;
};

const pnpmWhy = ({
  packageName,
  appName,
}: {
  packageName: string;
  appName: string;
}): string =>
  execSync(
    `pnpm why --recursive --parseable ${packageName} --filter ${appName} --depth 0`,
    {
      encoding: 'utf8',
    },
  );
