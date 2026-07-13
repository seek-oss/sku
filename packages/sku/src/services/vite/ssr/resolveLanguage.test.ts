import { describe, expect, it } from 'vitest';
import { resolveRequestLanguage } from './resolveLanguage.js';

describe('resolveRequestLanguage', () => {
  it('returns undefined when no languages are configured', () => {
    expect(
      resolveRequestLanguage({
        matches: [{ params: { language: 'en' }, route: {} }],
        languages: [],
        requestLanguage: 'en',
      }),
    ).toBeUndefined();
  });

  it('prefers the request language slot over the route param', () => {
    expect(
      resolveRequestLanguage({
        matches: [
          {
            params: { language: 'en' },
            route: {},
          },
        ],
        languages: ['en', 'fr', 'th-TH'],
        requestLanguage: 'th-TH',
      }),
    ).toBe('th-TH');
  });

  it('uses the language route param', () => {
    expect(
      resolveRequestLanguage({
        matches: [{ params: { language: 'fr' }, route: {} }],
        languages: ['en', 'fr'],
      }),
    ).toBe('fr');
  });

  it('falls back to the sole configured language', () => {
    expect(
      resolveRequestLanguage({
        matches: [{ params: {}, route: {} }],
        languages: ['en'],
      }),
    ).toBe('en');
  });

  it('does not guess when multiple languages are configured without a slot or param', () => {
    expect(
      resolveRequestLanguage({
        matches: [{ params: {}, route: {} }],
        languages: ['en', 'fr'],
      }),
    ).toBeUndefined();
  });

  it('soft-fails for an unknown request language without falling back to heuristics', () => {
    expect(
      resolveRequestLanguage({
        matches: [{ params: { language: 'en' }, route: {} }],
        languages: ['en', 'fr'],
        requestLanguage: 'de',
      }),
    ).toBeUndefined();
  });

  it('allows en-PSEUDO via the request slot', () => {
    expect(
      resolveRequestLanguage({
        matches: [{ params: {}, route: {} }],
        languages: ['en', 'fr'],
        requestLanguage: 'en-PSEUDO',
      }),
    ).toBe('en-PSEUDO');
  });

  it('soft-fails when URL segment does not match a configured language name', () => {
    expect(
      resolveRequestLanguage({
        matches: [{ params: { language: 'th' }, route: {} }],
        languages: ['en', 'fr', 'th-TH'],
      }),
    ).toBeUndefined();
  });
});
