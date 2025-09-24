import { autocomplete, cancel, isCancel, log } from '@clack/prompts';
import { getFixtureScripts } from './getFixtureScripts.ts';
import { styleText } from 'node:util';

export const selectScript = async (
  fixture: string,
  input?: string,
): Promise<[string, string]> => {
  const fixtureScripts = await getFixtureScripts(fixture);

  if (input) {
    if (input in fixtureScripts) {
      return [input, fixtureScripts[input]];
    }

    log.warn(
      `No script matching '${styleText(['bold', 'yellow'], input)}' found`,
    );
  }

  const selectedScript = await autocomplete({
    message: 'Select a script',
    options: Object.keys(fixtureScripts).map((scriptName) => ({
      value: scriptName,
    })),
  });

  if (isCancel(selectedScript)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  return [selectedScript, fixtureScripts[selectedScript]];
};
