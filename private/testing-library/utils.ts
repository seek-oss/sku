import { waitFor, type RenderResult } from 'cli-testing-library';

export const waitForExitCode = async (
  process: RenderResult,
  exitCode: number,
  debug: boolean = false,
) => {
  await waitFor(() => {
    const exit = process.hasExit();
    if (!hasExpectedExitCode(process, exitCode, debug)) {
      throw new Error(
        `Expected the command to exit with code ${exitCode} but got ${exit?.exitCode}`,
      );
    }
  });
};

// TODO refactor the tests to use this in expect. e.g., expect(hasExitCode(process, 0)).toBe(true). Will be done in a different branch.
/**
 * Checks if a command exited with the given code.
 * Useful in tests since it will output the debug information if it fails.
 */
export const hasExpectedExitCode = (
  process: RenderResult,
  exitCode: number,
  debug: boolean = true,
) => {
  const exit = process.hasExit();
  if (exit?.exitCode === exitCode) {
    return true;
  }
  if (debug) {
    process.debug();
  }
  return false;
};
