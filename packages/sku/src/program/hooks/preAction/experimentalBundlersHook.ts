const blockedCommands = ['build', 'start', 'start-ssr'];

export const experimentalBundlersHook = ({
  command,
  experimentalBundler,
  bundler,
}: {
  command: string;
  experimentalBundler: boolean;
  bundler: string;
}) => {
  if (!blockedCommands.includes(command)) {
    if (experimentalBundler) {
      console.warn(
        `The experimental bundler flag is only needed for the following commands: ${blockedCommands.join(', ')}.`,
      );
    }
    return;
  }
  if (experimentalBundler && bundler !== 'vite') {
    throw new Error(
      'Experimental bundlers are only supported with `vite` at the moment. Either remove the `--experimental-bundler` flag or switch to the `vite` bundler.',
    );
  }
  if (bundler === 'vite' && !experimentalBundler) {
    throw new Error(
      'The `vite` bundler is experimental. If you want to use it please use the `--experimental-bundler` flag.',
    );
  }
};
