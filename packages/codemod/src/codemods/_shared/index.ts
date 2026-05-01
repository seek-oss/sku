import { parseAsync, Lang } from '@ast-grep/napi';

export const testGlobals = ['describe', 'it', 'test'];
export const jestGlobals = [
  'expect',
  'beforeAll',
  'beforeEach',
  'afterAll',
  'afterEach',
  ...testGlobals,
];

export const serializeImports = (imports: Set<string>) =>
  Array.from(imports).sort().join(', ');

export const parseTsx = (source: string) => parseAsync(Lang.Tsx, source);
