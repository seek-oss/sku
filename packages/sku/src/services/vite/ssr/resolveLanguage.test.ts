import { describe, expect, it } from 'vitest';
import { resolveRequestLanguage } from './resolveLanguage.js';

describe('resolveRequestLanguage', () => {
  it('returns undefined when no languages are configured', () => {
    expect(
      resolveRequestLanguage({
        languages: [],
        requestLanguage: 'en',
      }),
    ).toBeUndefined();
  });

  it('uses the server entry language when valid', () => {
    expect(
      resolveRequestLanguage({
        languages: ['en', 'fr', 'th-TH'],
        requestLanguage: 'th-TH',
      }),
    ).toBe('th-TH');
  });

  it('falls back to the sole configured language', () => {
    expect(
      resolveRequestLanguage({
        languages: ['en'],
      }),
    ).toBe('en');
  });

  it('does not guess when multiple languages are configured without a server entry language', () => {
    expect(
      resolveRequestLanguage({
        languages: ['en', 'fr'],
      }),
    ).toBeUndefined();
  });

  it('soft-fails for an unknown server entry language without falling back to sole language', () => {
    expect(
      resolveRequestLanguage({
        languages: ['en'],
        requestLanguage: 'de',
      }),
    ).toBeUndefined();
  });

  it('allows en-PSEUDO via the server entry', () => {
    expect(
      resolveRequestLanguage({
        languages: ['en', 'fr'],
        requestLanguage: 'en-PSEUDO',
      }),
    ).toBe('en-PSEUDO');
  });

  it('does not resolve language from a URL-like segment without a server entry', () => {
    expect(
      resolveRequestLanguage({
        languages: ['en', 'fr', 'th-TH'],
      }),
    ).toBeUndefined();
  });
});
