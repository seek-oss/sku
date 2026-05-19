import { styleText } from 'node:util';

export const accent = (s: string) => styleText('blue', s);
export const accentLight = (s: string) => styleText('cyan', s);
export const caution = (s: string) => styleText('yellow', s);
export const error = (s: string) => styleText('red', s);
export const info = (s: string) => styleText('blue', s);
export const link = (s: string) => styleText('underline', s);
export const secondary = (s: string) => styleText('gray', s);
export const strong = (s: string) => styleText('bold', s);
export const success = (s: string) => styleText('green', s);
