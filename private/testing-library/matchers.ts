import { waitFor, type RenderResult } from 'cli-testing-library';
import { expect } from 'vitest';

declare module 'vitest' {
  interface Matchers {
    /**
     * Waits for the command to exit, then asserts that it exited with the given
     * code. Includes the command's output in the failure message.
     * @example await expect(command).toMatchExitCode(0)
     */
    toMatchExitCode: (exitCode: number) => Promise<void>;
  }
}

/** The tail end of a command's output is the most useful part when debugging a failure. */
const MAX_OUTPUT_LENGTH = 7000;

const truncateOutput = (output: string) =>
  output.length > MAX_OUTPUT_LENGTH
    ? `…${output.slice(-MAX_OUTPUT_LENGTH)}`
    : output;

expect.extend({
  async toMatchExitCode(command: RenderResult, expectedExitCode: number) {
    if (typeof command?.hasExit !== 'function') {
      throw new TypeError(
        `toMatchExitCode expects a RenderResult from @sku-private/testing-library, but received ${this.utils.printReceived(command)}`,
      );
    }

    try {
      await waitFor(() => {
        if (command.hasExit() === null) {
          throw new Error('Command has not exited');
        }
      });
    } catch {
      // Fall through so the assertion reports the exit code rather than the timeout.
    }

    const actualExitCode = command.hasExit()?.exitCode;

    return {
      pass: actualExitCode === expectedExitCode,
      actual: actualExitCode,
      expected: expectedExitCode,
      message: () =>
        [
          this.utils.matcherHint(
            `${this.isNot ? '.not' : ''}.toMatchExitCode`,
            'command',
            'exitCode',
          ),
          '',
          `Expected the command ${this.isNot ? 'not ' : ''}to exit with code ${this.utils.printExpected(expectedExitCode)}, but it ${
            actualExitCode === undefined
              ? 'has not exited'
              : `exited with code ${this.utils.printReceived(actualExitCode)}`
          }.`,
          '',
          'Output:',
          truncateOutput(command.getStdallStr()),
        ].join('\n'),
    };
  },
});
