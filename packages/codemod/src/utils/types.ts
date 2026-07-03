export type Transform = (
  source: string,
  filePath: string,
) => Promise<string | null>;
