import { build, type PluginOption } from 'vite';
import type { GeneratedProject } from './generate.ts';

const ASSERTION_PATTERN = /\bassert\b/;

export async function buildProject(
  project: GeneratedProject,
  plugins: PluginOption[],
): Promise<string> {
  const result = await build({
    root: project.root,
    configFile: false,
    logLevel: 'silent',
    plugins,
    build: {
      write: false,
      minify: false,
      reportCompressedSize: false,
      rolldownOptions: {
        input: project.entry,
        // Lets the no-plugin baseline build; the unassert variants remove these imports anyway.
        external: ['assert', 'node:assert', 'power-assert'],
      },
    },
  });

  const buildOutput = Array.isArray(result) ? result[0] : result;
  if (!buildOutput || !('output' in buildOutput)) {
    throw new Error('Expected a single build output');
  }

  return buildOutput.output[0].code;
}

export function assertStripped(code: string) {
  const match = ASSERTION_PATTERN.exec(code);
  if (match) {
    const context = code.slice(
      Math.max(0, match.index - 200),
      match.index + 200,
    );
    throw new Error(`Assertions survived the build:\n${context}`);
  }
}
