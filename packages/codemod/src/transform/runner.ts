import { glob } from 'tinyglobby';
import { intro, log, outro, stream, taskLog } from '@clack/prompts';
import { join, relative } from 'node:path';
import { CODEMODS } from '../utils/constants.js';
import { Worker } from 'node:worker_threads';
import os from 'node:os';
import picocolors from 'picocolors';
import debug from 'debug';
import {
  chooseInteractiveTransformerPaths,
  confirmDryRunFromPrompt,
  getTargetDirectoryFromPrompt,
  resolveCodemodModule,
} from './interactive-selection.js';

const debugLog = debug('sku:codemod');

export { transformerPathsForJestSubsteps } from './interactive-selection.js';

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

type WorkerProgress = { filePath: string; changed: boolean };
type WorkerDiff = { filePath: string; diff: string };
type WorkerMessage =
  | { type: 'PROGRESS'; data: WorkerProgress }
  | { type: 'DIFF'; data: WorkerDiff }
  | { type: 'FINISHED'; data: JobOutcome };

type WorkerHandlers = {
  onProgress?: (data: WorkerProgress) => void;
  onDiff?: (data: WorkerDiff) => void;
};

export const runTransform = async (
  transform: string,
  _path: string,
  options: Options,
): Promise<void> => {
  let transformerPaths: string[];
  let showClackOutro = false;

  if (transform) {
    const codemod = CODEMODS.find((c) => c.value === transform);
    if (!codemod) {
      log.error(
        [
          'Invalid transform choice, pick one of:',
          ...CODEMODS.map((c) => `- ${c.value}`),
        ].join('\n'),
      );
      process.exit(1);
    }
    transformerPaths = [resolveCodemodModule(codemod.value)];
  } else {
    intro('sku codemod');
    showClackOutro = true;
    transformerPaths = await chooseInteractiveTransformerPaths();
  }

  const path = _path || (await getTargetDirectoryFromPrompt());

  let dry = options.dry === true;
  if (showClackOutro && options.dry !== true) {
    dry = await confirmDryRunFromPrompt();
  }

  const runOptions: Options = { ...options, dry };

  if (runOptions.dry) {
    log.warn('Running in dry mode, no files will be modified.');
  }

  const filesExpanded = await getAllFiles(path);

  if (!filesExpanded.length) {
    log.warn(`No files found matching "${path}"`);
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

  // taskLog gives a rolling per-file log that clears on success.
  // In dry/print mode the diffs are the focus, so we skip the rolling progress
  // and let stream.message render each diff as it arrives instead.
  const showProgress = !runOptions.dry && !runOptions.print;
  const tlog = showProgress
    ? taskLog({ title: 'Running transforms…', limit: 6 })
    : null;
  if (!tlog) {
    log.step('Running transforms…');
  }

  // Diffs from parallel workers are funnelled through one promise chain so
  // their byte streams don't interleave under the same log entry.
  let diffChain: Promise<void> = Promise.resolve();

  const onProgress = (data: WorkerProgress) => {
    if (!tlog) {
      return;
    }
    const relPath = relative(process.cwd(), data.filePath) || data.filePath;
    const marker = data.changed ? picocolors.green('✓') : picocolors.dim('·');
    tlog.message(`${marker} ${relPath}`);
  };

  const onDiff = (data: WorkerDiff) => {
    const relPath = relative(process.cwd(), data.filePath) || data.filePath;
    diffChain = diffChain.then(() =>
      stream.message(diffChunks(relPath, data.diff)),
    );
  };

  let outcomes: JobOutcome[];

  try {
    outcomes = await Promise.all(
      Array.from({ length: cpus }, (_, i) => {
        debugLog(`Starting worker ${i + 1} of ${cpus}`);
        return runJobs(
          {
            transformerPaths,
            options: runOptions,
            jobs: filesExpanded
              .slice(i * chunkSize, (i + 1) * chunkSize)
              .map((filePath) => ({
                filePath,
              })),
          },
          { onProgress, onDiff },
        );
      }),
    );
    await diffChain;
  } finally {
    if (tlog) {
      tlog.success('Transforms finished.');
    } else {
      log.success('Transforms finished.');
    }
  }

  const finalOutcome = outcomes.reduce(
    (acc, outcome) => {
      acc.filesChanged += outcome.filesChanged;
      return acc;
    },
    { filesChanged: 0 },
  );

  log.info(`Files parsed: ${picocolors.bold(filesExpanded.length)}`);
  if (runOptions.dry) {
    log.warn(
      `${picocolors.bold(finalOutcome.filesChanged)} files found that would be changed.`,
    );
  } else {
    log.info(
      `Unchanged files: ${picocolors.bold(filesExpanded.length - finalOutcome.filesChanged)}`,
    );
    log.success(`Changed files: ${picocolors.bold(finalOutcome.filesChanged)}`);
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

/**
 * One stream.message chunk per file: clack renders each yielded chunk as a
 * paragraph under the bar, so we batch the whole diff into a single yield to
 * keep the diff visually contiguous.
 */
async function* diffChunks(
  filePath: string,
  diff: string,
): AsyncIterable<string> {
  yield `${picocolors.bold(filePath)}\n${diff}`;
}

const runJobs = (
  jobs: JobWorkerData,
  handlers: WorkerHandlers,
): Promise<JobOutcome> => {
  const workerPath = import.meta.resolve('@sku-lib/codemod/transform/worker');
  const worker = new Worker(new URL(workerPath), {
    workerData: jobs,
  });

  return new Promise((r, reject) => {
    worker.on('error', reject);

    let jobOutcome: JobOutcome = {
      filesChanged: 0,
    };

    worker.on('message', (message: WorkerMessage) => {
      if (message.type === 'FINISHED') {
        jobOutcome = message.data;
      } else if (message.type === 'PROGRESS') {
        handlers.onProgress?.(message.data);
      } else if (message.type === 'DIFF') {
        handlers.onDiff?.(message.data);
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
