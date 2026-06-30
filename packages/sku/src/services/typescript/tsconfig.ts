import type { SkuContext } from '../../context/createSkuContext.js';
import { requireFromCwd } from '@sku-private/utils';
import type { PackageJson, TsConfigJson } from 'type-fest';

const hasTypesInstalledForPackage = (packageName: string) => {
  try {
    // Trying to import @types/{packageName}/package.json can lead to false positives, so instead we'll check the dependencies directly.
    const packageJson: PackageJson = requireFromCwd('./package.json');
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    return Boolean(allDeps[`@types/${packageName}`]);
  } catch {
    return false;
  }
};

export const createTSConfig = ({
  tsconfigDecorator,
  tsPaths,
  testRunner,
}: SkuContext) => {
  const makeTypes = () => {
    const types = ['node'];

    // If a project doesn't have @types/jest installed then a TS lint error will be thrown if it's present in the types array.
    // This is possible if a project isn't testing anything, so they don't install the jest types.
    if (testRunner === 'jest' && hasTypesInstalledForPackage('jest')) {
      types.push('jest');
    }
    return types;
  };

  const config: { compilerOptions: TsConfigJson.CompilerOptions } = {
    compilerOptions: {
      // Don't compile anything, only perform type checking
      noEmit: true,

      // Emit build information for faster subsequent type checking
      incremental: true,
      // Emit build information to `node_modules` to avoid bloating the project root
      // and ignore files
      outDir: 'node_modules',

      // Fixes https://github.com/cypress-io/cypress/issues/1087
      skipLibCheck: true,

      // When dependencies have `type: module` TypeScript doesn't know how to resolve them,
      // so we need to set this to `bundler` or `node`
      moduleResolution: 'bundler',
      // This is required by `bundler` and for dynamic `import()`
      module: 'es2022',

      // resolution-related
      allowImportingTsExtensions: true,
      allowSyntheticDefaultImports: true,
      allowJs: true,
      esModuleInterop: true,
      isolatedModules: true,
      resolveJsonModule: true,

      // Simplifies import elision, and enforces correct usage of type-only imports.
      // Aligns with `babel-preset-typescript`'s `onlyRemoveTypeImports` option.
      verbatimModuleSyntax: true,

      // Side-effect imports for CSS/assets are resolved by bundlers, not TypeScript
      noUncheckedSideEffectImports: false,

      // misc
      strict: true,
      forceConsistentCasingInFileNames: true,
      jsx: 'react-jsx',
      lib: ['dom', 'es2022'],
      // keep this as es2022 to align with our browser support policy.
      target: 'es2022',
      ...(tsPaths ? { paths: tsPaths } : {}),

      // TS 6 no longer auto-discovers @types packages
      types: makeTypes(),
    },
  };

  return tsconfigDecorator(config);
};
