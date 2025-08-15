export const sanitizeString = (str: string) =>
  str
    .replaceAll(process.cwd(), '{cwd}')
    // Sanitize .pnpm paths to avoid test failures on different machines (and make them shorter)
    .replaceAll(
      /\/node_modules\/\.pnpm\/[^/]+@[^/]+_[^/]+\/node_modules\/([^/]+)/g,
      '/node_modules/$1',
    );
