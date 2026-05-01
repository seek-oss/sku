import { parseAsync, Lang } from '@ast-grep/napi';

export const parseTsx = (source: string) => parseAsync(Lang.Tsx, source);
