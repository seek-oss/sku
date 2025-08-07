export function sanitizeString(str: string) {
  const sanitized = str
    .replaceAll(process.cwd(), '{cwd}')
    // Sanitize .pnpm paths to avoid test failures on different machines
    .replaceAll(/\.pnpm\/[^/]+@[^/]+_[^/]+/g, '.pnpm/{package}')
    // replace 8-character hashes between dash and file extension.
    // This will reduce changes in snapshots when dependency hashes (vite, braid, etc.) change.
    .replaceAll(/-.{8}\.js(\.map)?/g, '-{hash}.js$1');

  return sanitized;
}
