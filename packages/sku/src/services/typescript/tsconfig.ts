import type { SkuContext } from '../../context/createSkuContext.js';
import type { TsConfigJson } from 'type-fest';
import { bundleReportFolder } from '../webpack/config/plugins/bundleAnalyzer.js';
import { coverageFolder } from '../../utils/coverageFolder.js';

const generateTypeScriptPaths = (
  pathAliases?: Record<string, string>,
): Record<string, string[]> | undefined => {
  if (!pathAliases || Object.keys(pathAliases).length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(pathAliases).map(([alias, destination]) => [
      alias,
      [destination],
    ]),
  );
};

export const createTSConfig = ({
  tsconfigDecorator,
  pathAliases,
  paths,
}: SkuContext) => {
  const tsPaths = generateTypeScriptPaths(pathAliases);

  const config: {
    compilerOptions: TsConfigJson.CompilerOptions;
    exclude: string[];
  } = {
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
      types: ['node'],
    },
    // `allowJs` would otherwise include sku's generated JS output in type checking.
    // Setting `exclude` replaces TypeScript's default, so `node_modules` must be listed too.
    exclude: [
      'node_modules',
      paths.relativeTarget,
      coverageFolder,
      bundleReportFolder,
    ],
  };

  return tsconfigDecorator(config);
};
