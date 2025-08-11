export const sanitizeString = (str: string) =>
  str
    .replaceAll(process.cwd(), '{cwd}')
    // Sanitize .pnpm paths to avoid test failures on different machines (and make them shorter)
    .replaceAll(
      /\/node_modules\/\.pnpm\/[^/]+@[^/]+_[^/]+\/node_modules\/([^/]+)/g,
      '/node_modules/$1',
    )
    // replace 8-character hashes between dash and file extension.
    // This will reduce changes in snapshots when dependency hashes (vite, braid, etc.) change.
    .replaceAll(
      /(?<!https:\/{2}[^ ]*)-.{8}(\.[a-z]+)(\.map)?$/gi,
      '-{hash}$1$2',
    );
