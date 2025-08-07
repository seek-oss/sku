export function sanitizeString(str: string) {
  const sanitized = str
    .replaceAll(process.cwd(), '{cwd}')
    // Sanitize .pnpm paths to make snapshots more readable
    .replaceAll(
      /node_modules\/\.pnpm\/[^/]+@[^/]+_[^/]+\/node_modules/g,
      '{node_modules}',
    )
    // replace 8-character hashes between dash and file extension.
    // This will reduce changes in snapshots when dependency hashes (vite, braid, etc.) change.
    .replaceAll(/-.{8}\.js(\.map)?/g, '-{hash}.js$1');

  return sanitized;
}
