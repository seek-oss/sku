import { intersects } from 'semver';

export const getCjsInteropDeps = ({
  cjsInteropDependencies,
  apolloClientVersion,
}: {
  cjsInteropDependencies: string[];
  apolloClientVersion: string | undefined;
}) => {
  const dependsOnApolloClientV3 =
    apolloClientVersion && intersects(apolloClientVersion, '^3');

  const serveCjsInteropDependencies = [...cjsInteropDependencies];
  if (dependsOnApolloClientV3) {
    serveCjsInteropDependencies.push('@apollo/client', '@apollo/client/react');
  }

  // Vite build seems to resolve `@apollo/client/react` correctly - applying CJS interop to it
  // results in build errors
  const buildCjsInteropDependencies = serveCjsInteropDependencies.filter(
    (dep) => !dep.startsWith('@apollo/client/react'),
  );

  return { serveCjsInteropDependencies, buildCjsInteropDependencies };
};
