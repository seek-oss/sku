const formatter: {
  format: (duration: {
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
  }) => string;
} =
  // @ts-expect-error TS 6.0 is required for Intl.DurationFormat types
  new Intl.DurationFormat('en', { style: 'narrow' });

/**
 * Formats a duration in milliseconds as a human-readable string (e.g. `500ms`, `1m 5s`).
 *
 * Fractional input is truncated. Milliseconds are only shown when the duration is under one second.
 */
export const formatMs = (milliseconds: number): string => {
  const totalMs = Math.trunc(milliseconds);
  const hours = Math.floor(totalMs / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1_000);
  const ms = totalMs < 1_000 ? totalMs % 1_000 : 0;

  return formatter.format({
    hours,
    minutes,
    seconds,
    milliseconds: ms,
  });
};
