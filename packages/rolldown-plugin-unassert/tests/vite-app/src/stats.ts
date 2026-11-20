import assert from 'assert';
import invariant from 'tiny-invariant';
import { average, clamp } from 'fake-dep';

export function normalizedScore(scores: number[], max: number): number {
  assert(scores.length > 0, 'scores must not be empty');
  invariant(max > 0, 'max must be positive');

  const score = clamp(average(scores), 0, max) / max;

  assert.ok(score >= 0 && score <= 1);
  console.assert(!Number.isNaN(score), 'score must not be NaN');

  return score;
}
