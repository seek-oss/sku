import { cleanup as _cleanup } from 'cli-testing-library';
import { onTestFinished } from 'vitest';

const skipCleanupIds = new Set<string>();

export const cleanup = async (task?: { id: string }) => {
  if (task?.id && skipCleanupIds.has(task.id)) {
    return;
  }

  await _cleanup();
};

/**
 * Skips cleanup for the given test id, leaving tasks running in the background.
 * Make sure to run cleanup manually once you are ready to clean up the tasks.
 */
export const skipCleanup = (id: string) => {
  skipCleanupIds.add(id);
  // onTestFinished is called after the `afterEach` hook, but before the `afterAll` hook
  // so we use this to skip cleanup for just the given test id.
  onTestFinished(() => {
    skipCleanupIds.delete(id);
  });
};
