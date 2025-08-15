import { describe, it } from 'vitest';
import { sanitizeString } from './sanitizeString.ts';

describe('sanitizeFiles', () => {
  it('should replace process.cwd() with {cwd}', ({ expect }) => {
    const result = sanitizeString(`${process.cwd()}/foo/bar.js`);
    expect(result).toBe('{cwd}/foo/bar.js');
  });

  it('should replace .pnpm paths with {package}', ({ expect }) => {
    const result = sanitizeString(
      `/node_modules/.pnpm/foo@1.0.0_bar-1.0.0/node_modules/braid-design-system`,
    );
    expect(result).toBe('/node_modules/braid-design-system');
  });
});
