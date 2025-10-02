export type Transform = (source: string) => Promise<string | null>;

export const isValidTransform = (fn: unknown): fn is Transform =>
  typeof fn === 'function';
