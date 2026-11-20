import { strict as assert } from 'assert';

export function clamp(value, min, max) {
  assert.ok(typeof value === 'number', 'value must be a number');
  assert(min <= max, 'min must not exceed max');
  console.assert(Number.isFinite(value), 'value must be finite');

  return Math.min(Math.max(value, min), max);
}

export function average(values) {
  assert(
    Array.isArray(values) && values.length > 0,
    'values must be a non-empty array',
  );

  let total = 0;
  for (const value of values) {
    assert.equal(typeof value, 'number');
    total += value;
  }

  return total / values.length;
}
