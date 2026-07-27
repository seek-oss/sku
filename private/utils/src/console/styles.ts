/**
 * We have a custom eslint rule that prevents using `styleText` in favour of these custom functions.
 * Ignoring the rule here to allow us create these functions.
 */
// eslint-disable-next-line no-restricted-imports
import { styleText } from 'node:util';

export const accent = (s: string) => styleText('blue', s);
export const accentLight = (s: string) => styleText('cyan', s);
export const caution = (s: string) => styleText('yellow', s);
export const critical = (s: string) => styleText('red', s);
export const info = (s: string) => styleText('blue', s);
export const link = (s: string) => styleText('underline', s);
export const secondary = (s: string) => styleText('gray', s);
export const strong = (s: string) => styleText('bold', s);
export const success = (s: string) => styleText('green', s);
