import { intersects } from 'semver';
import debug from 'debug';

import { requireFromCwd } from '@sku-private/utils';

const log = debug('sku:cjsInteropDependencies');

type CjsInteropDependencies = {
  serveCjsInteropDependencies: string[];
  buildCjsInteropDependencies: string[];
};

export const getCjsInteropDeps = ({
  dependsOnApolloClient,
  cjsInteropDependencies,
}: {
  dependsOnApolloClient: boolean;
  cjsInteropDependencies: string[];
}): CjsInteropDependencies => {
  // Fall back to the previous behaviour of always including `@apollo/client`
  const fallbackCjsInteropDependencies = {
    serveCjsInteropDependencies: [...cjsInteropDependencies, '@apollo/client'],
    buildCjsInteropDependencies: [...cjsInteropDependencies, '@apollo/client'],
  };

  if (!dependsOnApolloClient) {
    return fallbackCjsInteropDependencies;
  }

  try {
    const apolloClientPackageJson = requireFromCwd(
      '@apollo/client/package.json',
    );
    const apolloClientVersion = apolloClientPackageJson.version as string;

    const dependsOnApolloClientV3 = intersects(apolloClientVersion, '^3');
    log({ apolloClientVersion, dependsOnApolloClientV3 });

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

    return fallbackCjsInteropDependencies;
  }
};
