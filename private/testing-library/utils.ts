import { waitFor, type RenderResult } from 'cli-testing-library';

/**
 * Checks if a command exited successfully outside of a test (beforeEach, beforeAll, etc.)
 *
 * If checking for an exit code in a test, please use `expect` to  assert the exit code. E.g.,
 * ```
 * await waitFor(() => {
 *    expect(process.hasExit()).toMatchObject({ exitCode: 0 });
 * });
 * ```
 */
export const hasExitSuccessfully = async (process: RenderResult) => {
  await waitFor(async () => {
    const exit = process.hasExit();
    if (!exit || exit.exitCode !== 0) {
      throw new Error(`command exited without code 0`);
    }
  });
};
