export type LintResult = { exitCode: number | undefined };

export type LintCheck = {
  name: string;
  run: () => Promise<LintResult>;
  skip?: boolean;
};

/**
 * Runs the provided lint checks sequentially, returning `true` if any
 * check exits with a non-zero exit code.
 */
export const runLintChecks = async (checks: LintCheck[]): Promise<boolean> => {
  let hasFailure = false;

  for (const { run, skip = false } of checks) {
    if (skip) {
      continue;
    }

    const { exitCode } = await run();
    if (exitCode !== 0) {
      hasFailure = true;
    }
  }

  return hasFailure;
};
