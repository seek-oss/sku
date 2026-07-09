import { describe, it, expect } from 'vitest';

import { formatMs } from './formatMs.js';

describe('formatMs', () => {
  it('formats sub-second durations in milliseconds', () => {
    expect(formatMs(500)).toBe('500ms');
    expect(formatMs(999)).toBe('999ms');
  });

  it('formats durations of one second or more without leftover milliseconds', () => {
    expect(formatMs(1000)).toBe('1s');
    expect(formatMs(1003)).toBe('1s');
    expect(formatMs(1503)).toBe('1s');
  });

  it('formats minutes and seconds', () => {
    expect(formatMs(65_000)).toBe('1m 5s');
    expect(formatMs(90_000)).toBe('1m 30s');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatMs(3_600_000)).toBe('1h');
    expect(formatMs(3_661_000)).toBe('1h 1m 1s');
  });

  it('formats durations longer than 24 hours', () => {
    expect(formatMs(86_400_000)).toBe('24h');
    expect(formatMs(90_000_000)).toBe('25h');
    expect(formatMs(172_800_000)).toBe('48h');
    expect(formatMs(176_461_000)).toBe('49h 1m 1s');
  });

  it('truncates fractional milliseconds', () => {
    expect(formatMs(1500.9)).toBe('1s');
    expect(formatMs(999.9)).toBe('999ms');
  });
});
