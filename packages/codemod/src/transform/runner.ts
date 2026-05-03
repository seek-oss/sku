import { glob } from 'tinyglobby';
import {
  intro,
  isCancel,
  multiselect,
  outro,
  path as pathPrompt,
  select,
  spinner,
} from '@clack/prompts';
import { join } from 'node:path';
import {
  CODEMODS,
  JEST_TO_VITEST_STEP_SLUGS,
  type CodemodName,
} from '../utils/constants.js';
import { Worker } from 'node:worker_threads';
import os from 'node:os';
import picocolors from 'picocolors';
import debug from 'debug';

const log = debug('sku:codemod');

const JEST_IMPORTS_SLUG = 'jest-to-vitest-imports' satisfies CodemodName;

type Options = {
  dry?: boolean;
  print?: boolean;
};

export type JobWorkerData = {
  transformerPaths: string[];
  options: Options;
  jobs: Array<{
    filePath: string;
  }>;
};

const codemodMeta = (slug: CodemodName) =>
  CODEMODS.find((c) => c.value === slug)?.description ?? slug;

const interactiveRootOptions = () =>
  CODEMODS.filter(
    (c) =>
      c.value === 'jest-to-vitest' || !c.value.startsWith('jest-to-vitest-'),
  ).map((c) => ({
    value: c.value,
    label: c.value,
    hint: c.description,
  }));

const resolveCodemodUrl = (slug: CodemodName | string) =>
  import.meta.resolve(`@sku-lib/codemod/codemods/${slug}`);

/** Canonical-order paths for granular jest-to-vitest steps; appends imports when needed. */
export const transformerPathsForJestSubsteps = (
  selectedSlugs: readonly string[],
): string[] => {
  const selected = new Set(selectedSlugs);
  let ordered = JEST_TO_VITEST_STEP_SLUGS.filter((s) => selected.has(s));

  const needsImports =
    [...selected].some((s) => s !== JEST_IMPORTS_SLUG) &&
    !selected.has(JEST_IMPORTS_SLUG);

  if (needsImports) {
    ordered = [...ordered, JEST_IMPORTS_SLUG];
  }

  return ordered.map((slug) => resolveCodemodUrl(slug));
};

const exitCancel = (): never => {
  process.exit(1);
};

const chooseInteractiveTransformerPaths = async (): Promise<string[]> => {
  const rootChoice = await select({
    message: 'Which transform would you like to apply?',
    options: interactiveRootOptions(),
  });

  if (isCancel(rootChoice)) {
    exitCancel();
  }

  if (rootChoice !== 'jest-to-vitest') {
    return [resolveCodemodUrl(rootChoice)];
  }

  const pipelineMode = await select({
    message: 'Jest → Vitest migration',
    options: [
      {
        value: 'full' as const,
        label: 'Run full pipeline',
        hint: 'All steps in order (recommended)',
      },
      {
        value: 'steps' as const,
        label: 'Choose specific steps',
        hint: 'Pick substeps; import synthesis runs last when needed',
      },
    ],
    initialValue: 'full',
  });

  if (isCancel(pipelineMode)) {
    exitCancel();
  }

  if (pipelineMode === 'full') {
    return [resolveCodemodUrl('jest-to-vitest')];
  }

  const picked = await multiselect({
    message: 'Select steps (runs in canonical order, not selection order)',
    options: JEST_TO_VITEST_STEP_SLUGS.map((slug) => ({
      value: slug,
      label: slug,
      hint: codemodMeta(slug),
    })),
    required: true,
  });

  if (isCancel(picked)) {
    exitCancel();
  }

  return transformerPathsForJestSubsteps(picked);
};

const getPathFromPrompt = async (): Promise<string> => {
  const pathResult = await pathPrompt({
    message: 'Which directory should the codemods run on?',
    directory: true,
    initialValue: '.',
  });

  if (isCancel(pathResult)) {
    exitCancel();
  }

  return pathResult;
};

export const runTransform = async (
  transform: string,
  _path: string,
  options: Options,
): Promise<void> => {
  let transformerPaths: string[];
  let showClackOutro = false;

  if (options.dry) {
    console.log(
      picocolors.yellowBright(
        picocolors.bold('Running in dry mode, no files will be modified.'),
      ),
    );
  }

  if (transform) {
    if (!CODEMODS.find((codemod) => codemod.value === transform)) {
      console.error('Invalid transform choice, pick one of:');
      console.error(CODEMODS.map((codemod) => `- ${codemod.value}`).join('\n'));
      process.exit(1);
    }
    transformerPaths = [resolveCodemodUrl(transform)];
  } else {
    intro('sku codemod');
    showClackOutro = true;
    transformerPaths = await chooseInteractiveTransformerPaths();
  }

  const path = _path || (await getPathFromPrompt());

  const filesExpanded = await getAllFiles(path);

  if (!filesExpanded.length) {
    console.log(`No files found matching "${path}"`);
    if (showClackOutro) {
      outro('No matching files.');
    }
    process.exit(0);
  }

  const cpus =
    os.cpus().length > filesExpanded.length
      ? filesExpanded.length
      : os.cpus().length;
  const chunkSize = Math.ceil(filesExpanded.length / cpus);

  const s = spinner();
  s.start('Running transforms…');

  let outcomes: JobOutcome[];

  try {
    outcomes = await Promise.all(
      Array.from({ length: cpus }, (_, i) => {
        log(`Starting worker ${i + 1} of ${cpus}`);
        return runJobs({
          transformerPaths,
          options,
          jobs: filesExpanded
            .slice(i * chunkSize, (i + 1) * chunkSize)
            .map((filePath) => ({
              filePath,
            })),
        });
      }),
    );
  } finally {
    s.stop('Transforms finished.');
  }

  const finalOutcome = outcomes.reduce(
    (acc, outcome) => {
      acc.filesChanged += outcome.filesChanged;
      return acc;
    },
    { filesChanged: 0 },
  );

  console.log(`Files parsed: ${picocolors.bold(filesExpanded.length)}`);
  if (options.dry) {
    console.log(
      picocolors.yellow(
        `${picocolors.bold(finalOutcome.filesChanged)} files found that would be changed.`,
      ),
    );
  } else {
    console.log(
      picocolors.yellowBright(
        `Unchanged files: ${picocolors.bold(filesExpanded.length - finalOutcome.filesChanged)}`,
      ),
    );
    console.log(
      picocolors.greenBright(
        `Changed files: ${picocolors.bold(finalOutcome.filesChanged)}`,
      ),
    );
  }

  if (showClackOutro) {
    outro('Done.');
  }

  process.exit(0);
};

const getAllFiles = (directory: string) =>
  glob(join(directory, '**/*.?(c|m){js,ts}?(x)'), {
    ignore: ['**/node_modules', '**/dist'],
    expandDirectories: false,
    absolute: true,
  });

type JobOutcome = {
  filesChanged: number;
};

const runJobs = (jobs: JobWorkerData): Promise<JobOutcome> => {
  const workerPath = import.meta.resolve('@sku-lib/codemod/transform/worker');
  const worker = new Worker(new URL(workerPath), {
    workerData: jobs,
  });

  return new Promise((r, reject) => {
    worker.on('error', reject);

    let jobOutcome: JobOutcome = {
      filesChanged: 0,
    };

    worker.on('message', (message) => {
      if (message.type === 'FINISHED') {
        jobOutcome = message.data;
      }
    });

    worker.on('exit', (code) => {
      if (code === 0) {
        r(jobOutcome);
      } else {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};
