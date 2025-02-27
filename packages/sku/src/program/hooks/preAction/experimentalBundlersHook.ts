import { getAddCommand } from '@/services/packageManager/packageManager.js';
import banner from '@/utils/banners/banner.js';

const blockedCommands = ['build', 'start', 'start-ssr'];

export const experimentalBundlersHook = ({
  command,
  experimentalBundler,
  bundler,
  isTelemetryInstalled,
}: {
  command: string;
  experimentalBundler: boolean;
  bundler: string;
  isTelemetryInstalled: boolean;
}) => {
  if (!blockedCommands.includes(command)) {
    if (experimentalBundler) {
      console.warn(
        `The experimental bundler flag is only needed for the following commands: ${blockedCommands.join(', ')}.`,
      );
    }
    return;
  }
  if (
    !isTelemetryInstalled &&
    bundler === 'vite' &&
    !process.env.SKU_TELEMETRY
  ) {
    const addCommand = getAddCommand({
      deps: ['@seek/sku-telemetry'],
      type: 'dev',
    });

    banner('error', '@seek/sku-telemetry not installed', [
      'In order to run `vite` as your bundler you must install our private telemetry package that gives us insights on usage, errors and performance.',
      addCommand,
      'Non SEEK based usage can disable this message with `SKU_TELEMETRY=false`',
    ]);
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
