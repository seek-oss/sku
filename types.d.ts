// the eslint-config-seek module is not typed, so we need to create a custom type for it
declare module 'eslint-config-seek' {
  import type { Linter } from 'eslint';

  const config: Linter.Config[];
  export default config;
}
