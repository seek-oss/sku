export type LintResult = { exitCode: number | undefined };

export type LintCheck = {
  name: string;
  run: () => Promise<LintResult>;
};

export const FAILURE_EXIT_CODE = 1;
export const SUCCESS_EXIT_CODE = 0;

/**
 * Runs the provided lint checks sequentially, returning `true` if any
 * check exits with a non-zero exit code.
 */
export const runLintChecks = async (checks: LintCheck[]): Promise<boolean> => {
  let hasFailure = false;

  for (const { run } of checks) {
    const { exitCode } = await run();
    if (exitCode !== SUCCESS_EXIT_CODE) {
      hasFailure = true;
    }
  }

  return hasFailure;
};
