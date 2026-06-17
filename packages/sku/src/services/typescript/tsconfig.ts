import type { SkuContext } from '../../context/createSkuContext.js';
import type { TsConfigJson } from 'type-fest';

export const createTSConfig = ({
  tsconfigDecorator,
  tsPaths,
  testRunner,
}: SkuContext) => {
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
      // ? should we update this to es2025
      target: 'es2022',
      ...(tsPaths ? { paths: tsPaths } : {}),

      // TS 6 no longer auto-discovers @types packages
      types: ['node', ...(testRunner === 'jest' ? ['jest'] : [])],
    },
  };

  return tsconfigDecorator(config);
};
