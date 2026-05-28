// @ts-expect-error TS 6.0 is required for Intl.DurationFormat types
const formatter = new Intl.DurationFormat('en', { style: 'narrow' });

export const formatMs = (ms: number): string => formatter({ ms });
