export type LintResult = { exitCode: number | undefined };

export type LintCheck = {
  name: string;
  run: () => Promise<LintResult>;
};

/**
 * Runs the provided lint checks sequentially, returning `true` if any
 * enabled check exits with a non-zero (or undefined) exit code.
 */
export const runLintChecks = async (checks: LintCheck[]): Promise<boolean> => {
  let hasFailure = false;

  for (const { run } of checks) {
    const { exitCode } = await run();
    if (exitCode !== 0) {
      hasFailure = true;
    }
  }

  return hasFailure;
};
