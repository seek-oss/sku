import { readdirSync, rmSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import type { TestProject } from 'vitest/node';
import { generateProject, type GeneratedProject } from './generate.ts';

declare module 'vitest' {
  export interface ProvidedContext {
    generatedProject: GeneratedProject;
  }
}

const FILE_COUNT = Number(process.env.BENCH_FILE_COUNT ?? 10_000);
const MINIMUM_LINES_PER_FILE = 100;

export default async function setup(project: TestProject) {
  // Vitest also runs global setup for the plain test project it derives the bench project from.
  if (!project.config.benchmark.enabled) {
    return undefined;
  }

  // A hard kill skips every cleanup hook below, so remove directories left by earlier runs.
  for (const entry of readdirSync(import.meta.dirname)) {
    if (entry.startsWith('.generated-')) {
      rmSync(join(import.meta.dirname, entry), {
        recursive: true,
        force: true,
      });
    }
  }

  const root = await mkdtemp(join(import.meta.dirname, '.generated-'));
  const cleanup = () => rmSync(root, { recursive: true, force: true });

  // Teardown doesn't run when the process is killed, so also clean up on exit.
  process.once('exit', cleanup);
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      cleanup();
      process.exit(130);
    });
  }

  const startTime = performance.now();
  const generated = await generateProject(root, {
    fileCount: FILE_COUNT,
    minimumLinesPerFile: MINIMUM_LINES_PER_FILE,
  });
  console.log(
    `Generated ${generated.fileCount} modules (>= ${MINIMUM_LINES_PER_FILE} lines, ${generated.assertionCount} assertions) ` +
      `in ${Math.round(performance.now() - startTime)}ms at ${root}`,
  );

  project.provide('generatedProject', generated);

  return () => {
    cleanup();
    process.off('exit', cleanup);
  };
}
